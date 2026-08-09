import { randomUUID } from "crypto";
import { Hono } from "hono";
import type { Context } from "hono";
import { D1Client, getD1Client } from "./d1";
import {
  ALLOWED_PHOTO_TYPES,
  MAX_PHOTO_BYTES,
  extensionFor,
  getPhotoStore,
} from "./r2";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
  createCustomer,
  createWorkLog,
  deleteCustomer,
  deleteWorkLog,
  getCustomer,
  getWorkLog,
  listCustomerWorkLogs,
  listCustomers,
  listWorkLogs,
  resetAll,
  seed,
  updateCustomer,
  updateWorkLog,
} from "./repo";
import {
  TARGET_STATUSES,
  TargetStatus,
  WorkLogInput,
} from "./types";

type AppEnv = {
  Variables: {
    db: D1Client;
  };
};

const app = new Hono<AppEnv>();

const D1_NOT_CONFIGURED =
  "D1 database is not configured. Set CF_ACCOUNT_ID, CF_API_TOKEN and CF_D1_DATABASE_ID environment variables.";

function requireDb(c: Context<AppEnv>, next: () => Promise<void>): Promise<Response> | Promise<void> {
  const db = getD1Client();
  if (!db) {
    return Promise.resolve(c.json({ error: D1_NOT_CONFIGURED }, 503));
  }
  c.set("db", db);
  return next();
}

// ---------- Service info ----------

app.get("/", (c) => {
  const db = getD1Client();
  return c.json({
    service: "works-log API",
    version: "v1",
    d1Configured: !!db,
    resources: {
      customers: ["GET /customers", "POST /customers", "GET /customers/:id", "PUT /customers/:id", "DELETE /customers/:id", "GET /customers/:id/work-logs"],
      workLogs: ["GET /work-logs", "POST /work-logs", "GET /work-logs/:id", "PUT /work-logs/:id", "DELETE /work-logs/:id"],
      uploads: ["POST /uploads", "GET /uploads/:key"],
    },
  });
});

app.post("/seed", async (c) => {
  const db = getD1Client();
  if (!db) {
    return c.json({ error: D1_NOT_CONFIGURED }, 503);
  }
  await seed(db);
  return c.json({ success: true });
});

app.post("/reset", async (c) => {
  const db = getD1Client();
  if (!db) {
    return c.json({ error: D1_NOT_CONFIGURED }, 503);
  }
  await resetAll(db);
  return c.json({ success: true, cleared: ["customers", "work_logs", "work_log_targets"] });
});

app.use("/customers/*", (c, next) => requireDb(c, next));
app.use("/work-logs/*", (c, next) => requireDb(c, next));

// ---------- Customers ----------

app.get("/customers", async (c) => {
  const search = c.req.query("search") ?? "";
  const customers = await listCustomers(c.get("db"), search);
  return c.json({ data: customers, total: customers.length });
});

app.post("/customers", async (c) => {
  const body = await readJsonBody(c);
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  if (!name) throw new ValidationError("name is required");

  const customer = await createCustomer(c.get("db"), {
    name,
    phone: optionalString(body.phone),
    photo: optionalString(body.photo),
    address: optionalString(body.address),
  });
  return c.json({ data: customer }, 201);
});

app.get("/customers/:id", async (c) => {
  const customer = await getCustomer(c.get("db"), c.req.param("id"));
  if (!customer) throw new NotFoundError("Customer not found");
  return c.json({ data: customer });
});

app.put("/customers/:id", async (c) => {
  const body = await readJsonBody(c);
  if (body.name !== undefined && (typeof body.name !== "string" || !body.name.trim())) {
    throw new ValidationError("name must be a non-empty string");
  }

  const customer = await updateCustomer(c.get("db"), c.req.param("id"), {
    name: body.name ? String(body.name).trim() : undefined,
    phone: body.phone !== undefined ? clearableString(body.phone) : undefined,
    photo: body.photo !== undefined ? clearableString(body.photo) : undefined,
    address: body.address !== undefined ? clearableString(body.address) : undefined,
  });
  if (!customer) throw new NotFoundError("Customer not found");
  return c.json({ data: customer });
});

app.delete("/customers/:id", async (c) => {
  const result = await deleteCustomer(c.get("db"), c.req.param("id"));
  if (result.kind === "not_found") throw new NotFoundError("Customer not found");
  if (result.kind === "referenced") {
    throw new ConflictError(`Cannot delete customer: it is referenced by ${result.referencedLogs} work log(s). Remove the references first.`);
  }
  return c.json({ success: true, deleted: true });
});

app.get("/customers/:id/work-logs", async (c) => {
  const logs = await listCustomerWorkLogs(c.get("db"), c.req.param("id"));
  return c.json({ data: logs, total: logs.length });
});

// ---------- Photo uploads (R2) ----------

app.post("/uploads", async (c) => {
  const store = getPhotoStore();

  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    throw new ValidationError("Request body must be multipart/form-data");
  }

  const file = form.get("photo");
  if (!(file instanceof File)) {
    throw new ValidationError("photo file is required (multipart field 'photo')");
  }
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    throw new ValidationError("photo must be a PNG, JPEG, WebP, GIF, or AVIF image");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new ValidationError("photo must be 5 MB or smaller");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const key = `photos_${randomUUID()}${extensionFor(file.type)}`;

  await store.put(key, bytes, file.type);

  return c.json({ data: { key, url: `/api/v1/uploads/${key}` } }, 201);
});

app.get("/uploads/*", async (c) => {
  const key = sanitizeUploadKey(c.req.path.slice("/uploads/".length));
  if (!key) throw new NotFoundError("File not found");

  const store = getPhotoStore();
  const photo = await store.get(key);
  if (!photo) throw new NotFoundError("File not found");

  return new Response(photo.bytes, {
    status: 200,
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});

function sanitizeUploadKey(key: string): string {
  const cleaned = key.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\/+|\/+$/g, "");
  if (!cleaned || cleaned.includes("..")) return "";
  if (!/^[a-zA-Z0-9._/-]+$/.test(cleaned)) return "";
  return cleaned;
}

// ---------- Work logs ----------

app.get("/work-logs", async (c) => {
  const filters = {
    date: c.req.query("date"),
    customerId: c.req.query("customerId"),
    search: c.req.query("search"),
  };
  const logs = await listWorkLogs(c.get("db"), filters);
  return c.json({ data: logs, total: logs.length });
});

app.post("/work-logs", async (c) => {
  const body = await readJsonBody(c);
  validateWorkLogInput(body);

  const log = await createWorkLog(c.get("db"), {
    title: String(body.title).trim(),
    date: String(body.date),
    desc: optionalString(body.desc),
    targets: normalizeTargets(body.targets),
  });
  return c.json({ data: log }, 201);
});

app.get("/work-logs/:id", async (c) => {
  const log = await getWorkLog(c.get("db"), c.req.param("id"));
  if (!log) throw new NotFoundError("Work log not found");
  return c.json({ data: log });
});

app.put("/work-logs/:id", async (c) => {
  const body = await readJsonBody(c);
  validateWorkLogInput(body, true);

  const log = await updateWorkLog(c.get("db"), c.req.param("id"), {
    title: body.title !== undefined ? String(body.title).trim() : undefined,
    date: body.date !== undefined ? String(body.date) : undefined,
    desc: body.desc !== undefined ? optionalString(body.desc) : undefined,
    targets: body.targets !== undefined ? normalizeTargets(body.targets) : undefined,
  });
  if (!log) throw new NotFoundError("Work log not found");
  return c.json({ data: log });
});

app.delete("/work-logs/:id", async (c) => {
  const deleted = await deleteWorkLog(c.get("db"), c.req.param("id"));
  if (!deleted) throw new NotFoundError("Work log not found");
  return c.json({ success: true, deleted: true });
});

// ---------- Helpers ----------

async function readJsonBody(c: Context<AppEnv>): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const str = String(value).trim();
  return str === "" ? undefined : str;
}

// Unlike optionalString, an explicit empty string (or null) means "clear this field".
function clearableString(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
}

function validateWorkLogInput(body: Record<string, unknown>, partial = false): void {
  if (!partial) {
    if (typeof body.title !== "string" || !body.title.trim()) throw new ValidationError("title is required");
    if (!isDate(body.date)) throw new ValidationError("date is required and must be in YYYY-MM-DD format");
  } else {
    if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim())) {
      throw new ValidationError("title must be a non-empty string");
    }
    if (body.date !== undefined && !isDate(body.date)) {
      throw new ValidationError("date must be in YYYY-MM-DD format");
    }
  }

  if (body.targets !== undefined) {
    if (!Array.isArray(body.targets)) throw new ValidationError("targets must be an array");
    for (const t of body.targets as Record<string, unknown>[]) {
      if (!t || typeof t !== "object" || typeof t.customerId !== "string" || !t.customerId) {
        throw new ValidationError("each target requires a customerId");
      }
      if (t.status !== undefined && (typeof t.status !== "string" || !(TARGET_STATUSES as readonly string[]).includes(t.status))) {
        throw new ValidationError(`target status must be one of: ${TARGET_STATUSES.join(", ")}`);
      }
    }
  }
}

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function normalizeTargets(targets: unknown): WorkLogInput["targets"] {
  if (targets === undefined) return undefined;
  if (!Array.isArray(targets)) throw new ValidationError("targets must be an array");
  return (targets as Record<string, unknown>[]).map((t) => ({
    customerId: String(t.customerId),
    status: (t.status ?? "meet") as TargetStatus,
    desc: optionalString(t.desc),
  }));
}

app.onError((err, c) => {
  if (err instanceof ValidationError) return c.json({ error: err.message }, 400);
  if (err instanceof NotFoundError) return c.json({ error: err.message }, 404);
  if (err instanceof ConflictError) return c.json({ error: err.message }, 409);
  console.error("[api]", err);
  return c.json({ error: err.message || "Internal server error" }, 500);
});

app.notFound((c) => c.json({ error: `Not found: ${c.req.method} ${c.req.path}` }, 404));

export const api = app;

import { randomUUID } from "crypto";
import type { D1Client } from "./d1";
import {
  Customer,
  CustomerInput,
  CustomerRow,
  TargetCustomer,
  TargetCustomerInput,
  TargetRow,
  WorkLog,
  WorkLogFilters,
  WorkLogInput,
  WorkLogRow,
} from "./types";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? undefined,
    photo: row.photo ?? undefined,
    address: row.address ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkLog(row: WorkLogRow): WorkLog {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    desc: row.description ?? undefined,
    targets: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTarget(row: TargetRow, customers?: Map<string, Customer>): TargetCustomer {
  return {
    id: row.id,
    workLogId: row.work_log_id,
    customerId: row.customer_id,
    status: row.status as TargetCustomer["status"],
    desc: row.description ?? undefined,
    customer: customers?.get(row.customer_id),
  };
}

function inPlaceholders(count: number): string {
  return Array.from({ length: count }, (_, i) => `?${i + 1}`).join(", ");
}

async function fetchCustomersByIds(db: D1Client, ids: string[]): Promise<Map<string, Customer>> {
  const map = new Map<string, Customer>();
  if (ids.length === 0) return map;

  const res = await db
    .prepare(`SELECT * FROM customers WHERE id IN (${inPlaceholders(ids.length)})`)
    .bind(...ids)
    .all<CustomerRow>();
  for (const row of res.results) {
    map.set(row.id, mapCustomer(row));
  }
  return map;
}

async function fetchTargetsForLogIds(db: D1Client, logIds: string[]): Promise<Map<string, TargetRow[]>> {
  const map = new Map<string, TargetRow[]>();
  if (logIds.length === 0) return map;

  const res = await db
    .prepare(`SELECT * FROM work_log_targets WHERE work_log_id IN (${inPlaceholders(logIds.length)})`)
    .bind(...logIds)
    .all<TargetRow>();
  for (const row of res.results) {
    const list = map.get(row.work_log_id) ?? [];
    list.push(row);
    map.set(row.work_log_id, list);
  }
  return map;
}

async function fetchWorkLogsByIds(db: D1Client, ids: string[]): Promise<WorkLog[]> {
  if (ids.length === 0) return [];

  const logRes = await db
    .prepare(
      `SELECT * FROM work_logs WHERE id IN (${inPlaceholders(ids.length)}) ORDER BY date DESC, created_at DESC`
    )
    .bind(...ids)
    .all<WorkLogRow>();

  const targetMap = await fetchTargetsForLogIds(
    db,
    logRes.results.map((l) => l.id)
  );
  const customerIds = [...new Set(Array.from(targetMap.values()).flatMap((rows) => rows.map((r) => r.customer_id)))];
  const customerMap = await fetchCustomersByIds(db, customerIds);

  return logRes.results.map((row) => ({
    ...mapWorkLog(row),
    targets: (targetMap.get(row.id) ?? []).map((t) => mapTarget(t, customerMap)),
  }));
}

// ---------- Customers ----------

export async function listCustomers(db: D1Client, search = ""): Promise<Customer[]> {
  if (search.trim()) {
    const like = `%${search.trim()}%`;
    const res = await db
      .prepare(`SELECT * FROM customers WHERE name LIKE ?1 OR phone LIKE ?2 OR address LIKE ?3 ORDER BY name ASC`)
      .bind(like, like, like)
      .all<CustomerRow>();
    return res.results.map(mapCustomer);
  }

  const res = await db.prepare(`SELECT * FROM customers ORDER BY name ASC`).all<CustomerRow>();
  return res.results.map(mapCustomer);
}

export async function getCustomer(db: D1Client, id: string): Promise<Customer | null> {
  const row = await db
    .prepare(`SELECT * FROM customers WHERE id = ?1`)
    .bind(id)
    .first<CustomerRow>();
  return row ? mapCustomer(row) : null;
}

export async function createCustomer(db: D1Client, input: CustomerInput): Promise<Customer> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO customers (id, name, phone, photo, address, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6)`
    )
    .bind(id, input.name, input.phone ?? null, input.photo ?? null, input.address ?? null, now)
    .run();

  const created = await getCustomer(db, id);
  if (!created) throw new Error("Failed to create customer");
  return created;
}

export async function updateCustomer(db: D1Client, id: string, input: Partial<CustomerInput>): Promise<Customer | null> {
  const existing = await getCustomer(db, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE customers SET name = ?1, phone = ?2, photo = ?3, address = ?4, updated_at = ?5 WHERE id = ?6`)
    .bind(
      input.name ?? existing.name,
      input.phone !== undefined ? input.phone : existing.phone ?? null,
      input.photo !== undefined ? input.photo : existing.photo ?? null,
      input.address !== undefined ? input.address : existing.address ?? null,
      now,
      id
    )
    .run();

  return getCustomer(db, id);
}

export async function deleteCustomer(
  db: D1Client,
  id: string
): Promise<{ kind: "deleted" } | { kind: "not_found" } | { kind: "referenced"; referencedLogs: number }> {
  const existing = await getCustomer(db, id);
  if (!existing) return { kind: "not_found" };

  const ref = await db
    .prepare(`SELECT COUNT(*) AS c FROM work_log_targets WHERE customer_id = ?1`)
    .bind(id)
    .first<{ c: number }>();
  const referencedLogs = Number(ref?.c ?? 0);
  if (referencedLogs > 0) {
    return { kind: "referenced", referencedLogs };
  }

  await db.prepare(`DELETE FROM customers WHERE id = ?1`).bind(id).run();
  return { kind: "deleted" };
}

// ---------- Work logs ----------

export async function listCustomerWorkLogs(db: D1Client, customerId: string): Promise<WorkLog[]> {
  const targetRes = await db
    .prepare(`SELECT work_log_id FROM work_log_targets WHERE customer_id = ?1`)
    .bind(customerId)
    .all<{ work_log_id: string }>();

  const ids = [...new Set(targetRes.results.map((r) => r.work_log_id))];
  return fetchWorkLogsByIds(db, ids);
}

export async function listWorkLogs(db: D1Client, filters: WorkLogFilters = {}): Promise<WorkLog[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];
  let n = 0;

  if (filters.date) {
    clauses.push(`date = ?${++n}`);
    params.push(filters.date);
  }

  if (filters.search?.trim()) {
    clauses.push(`(title LIKE ?${++n} OR description LIKE ?${++n})`);
    const like = `%${filters.search.trim()}%`;
    params.push(like, like);
  }

  let sql = `SELECT * FROM work_logs`;
  if (clauses.length > 0) sql += ` WHERE ${clauses.join(" AND ")}`;
  sql += ` ORDER BY date DESC, created_at DESC`;

  const logRes = await db.prepare(sql).bind(...params).all<WorkLogRow>();

  let logIds = logRes.results.map((l) => l.id);

  if (filters.customerId) {
    const targetRes = await db
      .prepare(`SELECT work_log_id FROM work_log_targets WHERE customer_id = ?1`)
      .bind(filters.customerId)
      .all<{ work_log_id: string }>();
    const customerLogIds = new Set(targetRes.results.map((r) => r.work_log_id));
    logIds = logIds.filter((id) => customerLogIds.has(id));
    if (logIds.length === 0) return [];
  }

  return fetchWorkLogsByIds(db, logIds);
}

export async function getWorkLog(db: D1Client, id: string): Promise<WorkLog | null> {
  const row = await db.prepare(`SELECT * FROM work_logs WHERE id = ?1`).bind(id).first<WorkLogRow>();
  if (!row) return null;

  const logs = await fetchWorkLogsByIds(db, [row.id]);
  return logs[0] ?? null;
}

async function replaceTargets(db: D1Client, workLogId: string, targets: TargetCustomerInput[]): Promise<void> {
  if (targets.length > 0) {
    const existing = await fetchCustomersByIds(
      db,
      targets.map((t) => t.customerId)
    );
    for (const t of targets) {
      if (!existing.has(t.customerId)) {
        throw new ValidationError(`target customerId "${t.customerId}" does not exist`);
      }
    }
  }

  await db.prepare(`DELETE FROM work_log_targets WHERE work_log_id = ?1`).bind(workLogId).run();

  for (const t of targets) {
    await db
      .prepare(
        `INSERT INTO work_log_targets (id, work_log_id, customer_id, status, description) VALUES (?1, ?2, ?3, ?4, ?5)`
      )
      .bind(randomUUID(), workLogId, t.customerId, t.status ?? "meet", t.desc ?? null)
      .run();
  }
}

export async function createWorkLog(db: D1Client, input: WorkLogInput): Promise<WorkLog> {
  const id = randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(`INSERT INTO work_logs (id, title, date, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)`)
    .bind(id, input.title, input.date, input.desc ?? null, now)
    .run();

  await replaceTargets(db, id, input.targets ?? []);

  const created = await getWorkLog(db, id);
  if (!created) throw new Error("Failed to create work log");
  return created;
}

export async function updateWorkLog(db: D1Client, id: string, input: Partial<WorkLogInput>): Promise<WorkLog | null> {
  const existing = await getWorkLog(db, id);
  if (!existing) return null;

  const now = new Date().toISOString();
  await db
    .prepare(`UPDATE work_logs SET title = ?1, date = ?2, description = ?3, updated_at = ?4 WHERE id = ?5`)
    .bind(
      input.title ?? existing.title,
      input.date ?? existing.date,
      input.desc !== undefined ? input.desc : existing.desc ?? null,
      now,
      id
    )
    .run();

  if (input.targets) {
    await replaceTargets(db, id, input.targets);
  }

  return getWorkLog(db, id);
}

export async function deleteWorkLog(db: D1Client, id: string): Promise<boolean> {
  const existing = await getWorkLog(db, id);
  if (!existing) return false;

  await db.prepare(`DELETE FROM work_log_targets WHERE work_log_id = ?1`).bind(id).run();
  await db.prepare(`DELETE FROM work_logs WHERE id = ?1`).bind(id).run();
  return true;
}

// ---------- Reset ----------

export async function resetAll(db: D1Client): Promise<void> {
  await db.prepare(`DELETE FROM work_log_targets`).run();
  await db.prepare(`DELETE FROM work_logs`).run();
  await db.prepare(`DELETE FROM customers`).run();
}

// ---------- Seed ----------

export async function seed(db: D1Client): Promise<void> {
  const count = await db.prepare(`SELECT COUNT(*) AS c FROM customers`).first<{ c: number }>();
  if (Number(count?.c ?? 0) > 0) return;

  const now = new Date().toISOString();

  const customers = [
    { name: "Sarah Connor", phone: "+1 555-0100", address: "100 Market St, San Francisco, CA" },
    { name: "David Miller", phone: "+1 555-0101", address: "22 Innovation Dr, Boston, MA" },
    { name: "Elena Rostova", phone: "+1 555-0102", address: "88 Harbor Ave, Seattle, WA" },
  ];

  const customerIds: string[] = [];
  for (const c of customers) {
    const id = randomUUID();
    customerIds.push(id);
    await db
      .prepare(
        `INSERT INTO customers (id, name, phone, photo, address, created_at, updated_at)
         VALUES (?1, ?2, ?3, NULL, ?4, ?5, ?5)`
      )
      .bind(id, c.name, c.phone, c.address, now)
      .run();
  }

  const isoDate = (d: Date) => d.toISOString().split("T")[0];
  const day = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    return isoDate(d);
  };

  const logs = [
    {
      title: "Follow-up sales pitch to Apex HealthTech",
      date: day(1),
      desc: "Demoed compliance module and shared pricing details.",
      targets: [{ index: 1, status: "sell", desc: "Awaiting decision" }],
    },
    {
      title: "Weekly sync with Starlight E-commerce",
      date: day(0),
      desc: "Aligned on Q4 platform rebuild timeline.",
      targets: [{ index: 2, status: "interesting", desc: "Scheduled follow-up" }],
    },
    {
      title: "Contract renewal discussion",
      date: day(0),
      desc: "Signed renewal agreement for Acme Global Corp.",
      targets: [{ index: 0, status: "meet", desc: "Signed" }],
    },
  ];

  for (const l of logs) {
    const id = randomUUID();
    await db
      .prepare(`INSERT INTO work_logs (id, title, date, description, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?5)`)
      .bind(id, l.title, l.date, l.desc, now)
      .run();

    for (const t of l.targets) {
      await db
        .prepare(
          `INSERT INTO work_log_targets (id, work_log_id, customer_id, status, description) VALUES (?1, ?2, ?3, ?4, ?5)`
        )
        .bind(randomUUID(), id, customerIds[t.index], t.status, t.desc ?? null)
        .run();
    }
  }
}

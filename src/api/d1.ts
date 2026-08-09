export interface D1ResultMeta {
  changed_db: boolean;
  changes: number;
  last_row_id: number;
  duration: number;
}

export interface D1Result<T = Record<string, unknown>> {
  success: boolean;
  meta: D1ResultMeta;
  results?: T[];
  error?: string;
}

export interface D1ClientOptions {
  accountId: string;
  apiToken: string;
  databaseId: string;
  apiUrl?: string;
}

interface CloudflareApiEnvelope {
  success: boolean;
  errors?: { code: number; message: string }[];
  messages?: unknown[];
  result?: Array<{ success: boolean; meta?: D1ResultMeta; results?: unknown[]; error?: string }>;
}

function buildQueryUrl(apiUrl: string, accountId: string, databaseId: string): string {
  return `${apiUrl}/accounts/${accountId}/d1/database/${databaseId}/query`;
}

export class D1Statement {
  private params: unknown[] = [];

  constructor(
    private readonly client: D1Client,
    private readonly sql: string
  ) {}

  bind(...values: unknown[]): this {
    this.params = values;
    return this;
  }

  async run(): Promise<{ success: boolean; meta: D1ResultMeta }> {
    const result = await this.client.execute(this.sql, this.params);
    return { success: result.success, meta: result.meta };
  }

  async first<T = Record<string, unknown>>(): Promise<T | null> {
    const result = await this.client.execute(this.sql, this.params);
    return (result.results?.[0] ?? null) as T | null;
  }

  async all<T = Record<string, unknown>>(): Promise<{ success: boolean; meta: D1ResultMeta; results: T[] }> {
    const result = await this.client.execute(this.sql, this.params);
    return { success: result.success, meta: result.meta, results: (result.results ?? []) as T[] };
  }
}

export class D1Client {
  private readonly apiUrl: string;
  private readonly accountId: string;
  private readonly apiToken: string;
  private readonly databaseId: string;

  constructor(options: D1ClientOptions) {
    this.accountId = options.accountId;
    this.apiToken = options.apiToken;
    this.databaseId = options.databaseId;
    this.apiUrl = (options.apiUrl ?? "https://api.cloudflare.com/client/v4").replace(/\/+$/, "");
  }

  async execute<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<D1Result<T>> {
    const url = buildQueryUrl(this.apiUrl, this.accountId, this.databaseId);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`D1 query failed (${res.status}): ${detail}`);
    }

    const json = (await res.json()) as CloudflareApiEnvelope;

    if (json.success === false) {
      const message = json.errors?.map((e) => e.message).join("; ") || "D1 request rejected";
      throw new Error(`D1 request failed: ${message}`);
    }

    const first = json.result?.[0];
    if (!first) {
      throw new Error("D1 returned an empty result set");
    }
    if (first.success === false) {
      throw new Error(first.error || "D1 statement failed");
    }

    return {
      success: true,
      meta: first.meta ?? { changed_db: false, changes: 0, last_row_id: 0, duration: 0 },
      results: (first.results ?? []) as T[],
    };
  }

  prepare(sql: string): D1Statement {
    return new D1Statement(this, sql);
  }

  async exec(sql: string): Promise<{ success: boolean; meta: D1ResultMeta }> {
    const result = await this.execute(sql);
    return { success: result.success, meta: result.meta };
  }

  async batch(stmts: D1Statement[]): Promise<Array<{ success: boolean; meta: D1ResultMeta }>> {
    const out: Array<{ success: boolean; meta: D1ResultMeta }> = [];
    for (const stmt of stmts) {
      out.push(await stmt.run());
    }
    return out;
  }
}

export function getD1Client(): D1Client | null {
  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken = process.env.CF_API_TOKEN;
  const databaseId = process.env.CF_D1_DATABASE_ID;

  if (!accountId || !apiToken || !databaseId) {
    return null;
  }

  return new D1Client({ accountId, apiToken, databaseId, apiUrl: process.env.CF_D1_API_URL });
}

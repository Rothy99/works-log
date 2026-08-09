-- Daily Work Log System - Cloudflare D1 schema
--
-- Apply locally:      npx wrangler d1 execute <DB_NAME> --file=schemas/schema.sql
-- Apply to prod:      npx wrangler d1 execute <DB_NAME> --file=schemas/schema.sql --remote
-- Local dev runner (scripts/dev-local.mjs) applies this automatically.

CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  photo      TEXT,
  address    TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

CREATE TABLE IF NOT EXISTS work_logs (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  date        TEXT NOT NULL,
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_work_logs_date ON work_logs(date);

CREATE TABLE IF NOT EXISTS work_log_targets (
  id          TEXT PRIMARY KEY,
  work_log_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'meet'
              CHECK (status IN ('meet', 'sell', 'interesting', 'not_meet')),
  description TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (work_log_id) REFERENCES work_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_targets_work_log ON work_log_targets(work_log_id);
CREATE INDEX IF NOT EXISTS idx_targets_customer ON work_log_targets(customer_id);

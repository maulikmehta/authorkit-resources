-- Arrivals from tagged links (functions/_middleware.js). Apply once with:
--   wrangler d1 execute authorkit_resources_db --remote --file migrations/0001_arrivals.sql
CREATE TABLE IF NOT EXISTS arrivals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  source TEXT NOT NULL,
  campaign TEXT,
  content TEXT,
  path TEXT NOT NULL,
  country TEXT
);
CREATE INDEX IF NOT EXISTS arrivals_ts ON arrivals (ts);

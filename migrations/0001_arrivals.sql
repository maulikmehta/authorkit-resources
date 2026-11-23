-- Arrivals from tagged links on resources.authorkit.pro and authorkit.pro
-- (functions/_middleware.js in each repo). Apply once with:
--   wrangler d1 execute authorkit_arrivals --remote --file migrations/0001_arrivals.sql
CREATE TABLE IF NOT EXISTS arrivals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts INTEGER NOT NULL,
  host TEXT NOT NULL,
  source TEXT NOT NULL,
  campaign TEXT,
  content TEXT,
  path TEXT NOT NULL,
  country TEXT
);
CREATE INDEX IF NOT EXISTS arrivals_ts ON arrivals (ts);

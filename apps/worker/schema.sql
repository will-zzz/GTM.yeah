-- Idempotent schema for local D1. Safe to re-run.

CREATE TABLE IF NOT EXISTS leads (
  id                    TEXT PRIMARY KEY,
  attio_record_id       TEXT,
  company_name          TEXT NOT NULL,
  domain                TEXT,
  entity_type           TEXT,
  primary_contact_name  TEXT,
  primary_contact_email TEXT,
  has_financial_history INTEGER NOT NULL DEFAULT 0,  -- 0/1 boolean
  status                TEXT NOT NULL,               -- HandoffStatus union
  missing_fields        TEXT NOT NULL DEFAULT '[]',  -- JSON string[]
  croak_score           INTEGER,                     -- 0-100 lead score (legacy column name)
  priority              TEXT,                        -- 'High' | 'Medium' | 'Low'
  pitch_hook            TEXT,                        -- 1-sentence LLM hook
  raw_payload           TEXT NOT NULL,               -- original webhook JSON
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

CREATE TABLE IF NOT EXISTS error_logs (
  id          TEXT PRIMARY KEY,
  request_id  TEXT NOT NULL,
  endpoint    TEXT NOT NULL,
  error_type  TEXT NOT NULL,        -- 'ValidationError' | 'ChaosFailure' | 'UpstreamError' | 'UnhandledError'
  severity    TEXT NOT NULL,        -- 'info' | 'warning' | 'error' | 'critical'
  message     TEXT NOT NULL,
  context     TEXT NOT NULL DEFAULT '{}', -- JSON: structured details
  lead_id     TEXT,                 -- nullable FK to leads.id
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_errors_created ON error_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS prospects (
  id                TEXT PRIMARY KEY,
  company_name      TEXT NOT NULL,
  domain            TEXT NOT NULL UNIQUE,
  headcount_growth  REAL NOT NULL,              -- Harmonic-style % YoY headcount growth
  tech_stack        TEXT NOT NULL,              -- Apollo-style technographics
  last_contacted_at TEXT,                       -- ISO timestamp, null until sequenced
  sequence_status   TEXT NOT NULL DEFAULT 'Unassigned', -- 'Unassigned' | 'Sequenced'
  created_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects(sequence_status);
CREATE INDEX IF NOT EXISTS idx_prospects_created ON prospects(created_at DESC);

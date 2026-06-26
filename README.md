# GTM.yeah

**GTM.yeah** is a demo of a go-to-market engineering platform. It ingests closed-won deal handoffs from Attio, validates required CPA onboarding data, enriches leads with an AI-generated pitch hook and priority score, and demonstrates production-grade reliability with a toggleable chaos mode — all on Cloudflare Workers, D1, and KV with a Vite + React dashboard.

## Architecture

```
                 ┌─────────────────────────────────────────────┐
                 │          Vite + React + Tailwind SPA          │
                 │   (Leads board, error log, flakiness toggle)  │
                 └───────────────────────┬─────────────────────┘
                                         │ /api → localhost:8787
                                         ▼
   POST /api/webhook/attio   ┌──────────────────────────────────┐
   POST /api/toggle-flakiness│      Cloudflare Worker (Hono)      │
   GET  /api/leads           │  validation → lead score → slack   │
   GET  /api/errors          └────────┬─────────────────┬─────────┘
   POST /api/dev/reset                 ▼                 ▼
                              ┌──────────────┐   ┌──────────────┐
                              │ D1 (SQLite)  │   │ KV (CACHE)   │
                              │ leads        │   │ flakiness    │
                              │ error_logs   │   │ ui_warnings  │
                              └──────────────┘   └──────────────┘
```

## Quickstart

```bash
npm install
npm run db:init          # create local D1 tables
npm run dev              # worker (:8787) + web (:5173)
```

Open **http://localhost:5173**.

Optional — pre-populate the board before a demo:

```bash
npm run seed             # requires worker running; 3 complete + 2 incomplete leads
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/webhook/attio` | Attio closed-won ingestor (chaos-aware) |
| `GET` | `/api/leads` | List all leads (newest first) |
| `GET` | `/api/leads/:id` | Single lead + KV warning |
| `GET` | `/api/errors` | Structured error log feed |
| `GET` | `/api/system/status` | Flakiness flag, counts, environment |
| `POST` | `/api/toggle-flakiness` | Toggle or set global chaos mode |
| `POST` | `/api/dev/reset` | **Dev only** — wipe leads, errors, KV warnings |

## 60-Second Demo Script

1. **"This is GTM.yeah — it catches GTM handoffs from Attio when a deal closes."**  
   Click **Valid — Northwind Analytics** → a complete lead appears with **Lead Score**, priority, and an AI **pitch hook**.

2. **"But real data is messy."**  
   Click **Missing Contact** → an incomplete lead appears listing exactly which fields are missing.

3. **"And real systems fail. Watch."**  
   Enable **Chaos mode** → fire the valid payload 5–6 times. ~Half fail — but the system **never silently breaks**: each failure shows a visible error envelope and lands in the **Error Log** panel.

4. **"Even when a downstream call dies, the lead is still saved."**  
   Point to a degraded response where Slack alerting failed but the handoff persisted.

5. **Reset for the next audience:** click **Reset data** (or run `npm run seed`).

## Project Structure

```
GTM.yeah/
├── apps/
│   ├── worker/          # Cloudflare Worker (Hono + D1 + KV)
│   └── web/             # Vite + React + Tailwind dashboard
├── scripts/
│   └── seed.mjs         # Demo data seeder
└── IMPLEMENTATION_PLAN.md
```

## Tech Stack

- **Backend:** Cloudflare Workers (TypeScript, Hono, Wrangler)
- **Database:** Cloudflare D1 (SQLite on the edge)
- **Cache:** Cloudflare KV (flakiness flag, UI warnings)
- **Frontend:** Vite + React + Tailwind CSS v4
- **Integrations (mocked):** Attio webhooks, Slack alerts, LLM enrichment

## Reliability Highlights

- Global `onError` handler logs structured errors to D1 and returns consistent `ApiResponse` envelopes
- Invalid business data → `200` + Incomplete status (not a system error)
- Downstream failures (Slack, LLM) degrade gracefully — the lead still persists
- Chaos middleware isolated to inbound webhooks and outbound alerts only
- React `ErrorBoundary` prevents blank-screen UI failures

## Local Dev Notes

- All commands use `--local` Wrangler mode — no Cloudflare account required
- Run `npm run db:init` after wiping `.wrangler/` or after schema changes
- Workers AI binding is disabled by default; Lead Score uses a deterministic mock (`USE_REAL_AI="false"`)
- Vite proxies `/api` to the worker — no CORS setup needed in the browser

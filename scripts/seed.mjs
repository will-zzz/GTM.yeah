#!/usr/bin/env node
/**
 * Seeds the local GTM.yeah worker with demo leads: 3 complete + 2 incomplete.
 * Requires the worker to be running at WORKER_URL (default http://localhost:8787).
 */

const BASE = process.env.WORKER_URL ?? "http://localhost:8787";
const WEBHOOK = `${BASE}/api/webhook/attio`;

const validPayloads = [
  {
    event: "deal.closed_won",
    record: {
      id: "seed_001",
      companyName: "Northwind Analytics",
      domain: "northwind.io",
      entityType: "LLC",
      primaryContact: { name: "Sarah Chen", email: "sarah@northwind.io" },
      financialHistory: true,
    },
  },
  {
    event: "deal.closed_won",
    record: {
      id: "seed_002",
      companyName: "Reed & Rivet",
      domain: "reedrivet.com",
      entityType: "C-Corp",
      primaryContact: { name: "Fiona Walsh", email: "fiona@reedrivet.com" },
      financialHistory: true,
    },
  },
  {
    event: "deal.closed_won",
    record: {
      id: "seed_003",
      companyName: "Atlas Manufacturing",
      domain: "atlasmfg.com",
      entityType: "S-Corp",
      primaryContact: { name: "Marcus Lee", email: "marcus@atlasmfg.com" },
      financialHistory: true,
    },
  },
];

const invalidPayloads = [
  {
    event: "deal.closed_won",
    record: {
      id: "seed_004",
      companyName: "Summit Retail Group",
      domain: "summitretail.com",
      entityType: "C-Corp",
      financialHistory: true,
    },
  },
  {
    event: "deal.closed_won",
    record: {
      id: "seed_005",
      companyName: "Meridian Health Co",
      domain: "meridianhealth.co",
      entityType: "S-Corp",
      primaryContact: { name: "James Ortiz", email: "jortiz@meridianhealth.co" },
      financialHistory: false,
    },
  },
];

async function fire(label, payload) {
  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  const status = body.ok ? body.data?.lead?.status ?? "ok" : body.error?.type;
  console.log(`  ${label}: HTTP ${res.status} → ${status}`);
  if (!body.ok) {
    console.error(`    ${body.error?.message}`);
  }
  return body;
}

async function main() {
  console.log(`Seeding GTM.yeah at ${BASE}\n`);

  await fetch(`${BASE}/api/toggle-flakiness`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ on: false }),
  });

  console.log("Complete handoffs:");
  for (const p of validPayloads) {
    await fire(p.record.companyName, p);
  }

  console.log("\nIncomplete handoffs:");
  for (const p of invalidPayloads) {
    await fire(p.record.companyName, p);
  }

  const status = await fetch(`${BASE}/api/system/status`).then((r) => r.json());
  console.log(`\nDone — ${status.leadCount} leads, ${status.errorCount} error log entries.`);
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  console.error("Is the worker running? Try: npm run dev:worker");
  process.exit(1);
});

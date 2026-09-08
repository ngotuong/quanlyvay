import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { GOOGLE_SYNC_SELECTS } from "../../src/lib/export/columns.mjs";
import { fetchAllRows } from "../../src/lib/export/pagination.mjs";

const exportRouteSource = await readFile(path.resolve(import.meta.dirname, "../../src/app/api/google-sync/export/route.ts"), "utf8");
const snapshotSource = await readFile(path.resolve(import.meta.dirname, "../../../../supabase/migrations/20260907072000_c20_consistent_export.sql"), "utf8");
const auditPageSource = await readFile(path.resolve(import.meta.dirname, "../../src/app/audit/page.tsx"), "utf8");
const businessQueriesSource = await readFile(path.resolve(import.meta.dirname, "../../src/lib/business/queries.ts"), "utf8");

test("Google Sync selects cast every money, rate and bigint identifier to text", () => {
  const requiredCasts = {
    loans: ["original_principal_vnd::text", "initial_daily_rate_percent::text"],
    transactions: ["amount_vnd::text"],
    lifecycleEvents: ["daily_rate_percent::text"],
    loanTermCorrections: ["original_principal_vnd::text", "initial_period_rate_percent::text"],
    interestPeriods: [
      "opening_principal_vnd::text",
      "closing_principal_vnd::text",
      "accrued_interest_vnd::text",
      "interest_payments_vnd::text",
      "closing_interest_balance_vnd::text",
    ],
  };

  for (const [dataset, casts] of Object.entries(requiredCasts)) {
    for (const cast of casts) assert.match(GOOGLE_SYNC_SELECTS[dataset], new RegExp(`(?:^|,)${cast}(?:,|$)`));
  }
});

test("Google Sync reads audit metadata only from the sanitized RPC", () => {
  assert.match(exportRouteSource, /rpc\("get_google_sync_snapshot"\)/);
  assert.match(snapshotSource, /public\.get_audit_logs_sanitized\(\)/);
  assert.doesNotMatch(snapshotSource, /public\.audit_logs/);
  assert.doesNotMatch(exportRouteSource, /from\("audit_logs"\)/);
  assert.doesNotMatch(GOOGLE_SYNC_SELECTS.auditLogs, /old_data|new_data|p256dh|auth_secret|endpoint/);
});

test("Audit UI paginates the sanitized RPC by URL without changing Google export", () => {
  assert.match(auditPageSource, /auditPageSize = 25/);
  assert.match(auditPageSource, /searchParams/);
  assert.match(auditPageSource, /Trang trước/);
  assert.match(auditPageSource, /Trang sau/);
  assert.match(businessQueriesSource, /rpc\("get_audit_logs_sanitized", undefined, \{ count: "exact" \}\)/);
  assert.match(businessQueriesSource, /\.range\(from, to\)/);
  assert.doesNotMatch(businessQueriesSource, /get_audit_logs_sanitized"\)\s*\.order\([\s\S]{0,180}\.limit\(100\)/);
});

test("Google Sync cursor advances when a notification is marked read", () => {
  assert.match(snapshotSource, /md5\(tables::text\)/);
  assert.match(snapshotSource, /read_at/);
});

test("export pagination returns every row beyond the PostgREST 1000-row limit", async () => {
  const source = Array.from({ length: 2505 }, (_, index) => ({ id: index + 1 }));
  const requestedRanges = [];
  const result = await fetchAllRows(async (from, to) => {
    requestedRanges.push([from, to]);
    return { data: source.slice(from, to + 1), error: null };
  });

  assert.equal(result.error, null);
  assert.equal(result.data.length, 2505);
  assert.deepEqual(requestedRanges, [[0, 999], [1000, 1999], [2000, 2999]]);
  assert.equal(result.data.at(-1).id, 2505);
});

test("export pagination stops and returns an error without partial data", async () => {
  let failedPageAttempts = 0;
  const result = await fetchAllRows(async (from) => from === 0
    ? { data: Array.from({ length: 2 }, (_, id) => ({ id })), error: null }
    : (failedPageAttempts += 1, { data: null, error: new Error("query failed") }), 2);

  assert.equal(result.data.length, 0);
  assert.match(String(result.error), /query failed/);
  assert.equal(failedPageAttempts, 2);
});

test("export pagination retries one transient read failure without duplicating rows", async () => {
  const source = Array.from({ length: 3 }, (_, id) => ({ id }));
  let attempts = 0;
  const result = await fetchAllRows(async (from, to) => {
    attempts += 1;
    if (attempts === 1) return { data: null, error: new Error("temporary failure") };
    return { data: source.slice(from, to + 1), error: null };
  });

  assert.equal(result.error, null);
  assert.deepEqual(result.data, source);
  assert.equal(attempts, 2);
  assert.match(exportRouteSource, /Google Sync export query failed/);
});

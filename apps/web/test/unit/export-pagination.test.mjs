import assert from "node:assert/strict";
import test from "node:test";
import { GOOGLE_SYNC_SELECTS } from "../../src/lib/export/columns.mjs";
import { fetchAllRows } from "../../src/lib/export/pagination.mjs";

test("Google Sync selects cast every money, rate and bigint identifier to text", () => {
  const requiredCasts = {
    loans: ["original_principal_vnd::text", "initial_daily_rate_percent::text"],
    transactions: ["amount_vnd::text"],
    lifecycleEvents: ["daily_rate_percent::text"],
    interestPeriods: [
      "opening_principal_vnd::text",
      "closing_principal_vnd::text",
      "accrued_interest_vnd::text",
      "interest_payments_vnd::text",
      "closing_interest_balance_vnd::text",
    ],
    auditLogs: ["id::text"],
  };

  for (const [dataset, casts] of Object.entries(requiredCasts)) {
    for (const cast of casts) assert.match(GOOGLE_SYNC_SELECTS[dataset], new RegExp(`(?:^|,)${cast}(?:,|$)`));
  }
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
  const result = await fetchAllRows(async (from) => from === 0
    ? { data: Array.from({ length: 2 }, (_, id) => ({ id })), error: null }
    : { data: null, error: new Error("query failed") }, 2);

  assert.equal(result.data.length, 0);
  assert.match(String(result.error), /query failed/);
});

import assert from "node:assert/strict";
import test from "node:test";
import { paginateLegacyLoanSummaries } from "../../src/lib/business/loan-list-pagination.mjs";

test("paginates the already filtered and sorted legacy RPC result", () => {
  const items = Array.from({ length: 52 }, (_, index) => ({ id: String(index + 1) }));
  const counts = { all: 80, lending: 50, borrowing: 30, active: 40, badDebt: 10, settled: 30 };

  assert.deepEqual(paginateLegacyLoanSummaries({ items, counts }, 2, 25), {
    items: items.slice(25, 50),
    counts,
    totalCount: 52,
  });
});

test("returns an empty last page without changing facet counts", () => {
  const counts = { all: 1 };
  assert.deepEqual(paginateLegacyLoanSummaries({ items: [{ id: "1" }], counts }, 3, 25), {
    items: [],
    counts,
    totalCount: 1,
  });
});

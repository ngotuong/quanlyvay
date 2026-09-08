import assert from "node:assert/strict";
import test from "node:test";
import { buildLegacyGeneralExpensesPage } from "../../src/lib/business/expense-list-pagination.mjs";

test("legacy expense fallback preserves bigint totals and reversal history", () => {
  const rows = [
    { id: "expense-2", type: "EXPENSE", amount_vnd: "9007199254740993", expenses: { category: "Khác" } },
    { id: "expense-1", type: "EXPENSE", amount_vnd: "7", expenses: { category: "Khác" } },
    { id: "reversal-1", type: "REVERSAL", amount_vnd: "7", reversal_of_id: "expense-1", expenses: null },
  ];

  const result = buildLegacyGeneralExpensesPage(rows, 1, 25);
  assert.equal(result.totalVnd, "9007199254740993");
  assert.equal(result.totalCount, 2);
  assert.equal(result.items[1].reversed, true);
  assert.deepEqual(result.categories, [{ category: "Khác", amountVnd: "9007199254740993" }]);
});

test("legacy expense fallback paginates in the query order", () => {
  const rows = Array.from({ length: 27 }, (_, index) => ({
    id: `expense-${index}`, type: "EXPENSE", amount_vnd: "1", expenses: null,
  }));
  const result = buildLegacyGeneralExpensesPage(rows, 2, 25);
  assert.deepEqual(result.items.map((item) => item.id), ["expense-25", "expense-26"]);
  assert.equal(result.totalCount, 27);
});

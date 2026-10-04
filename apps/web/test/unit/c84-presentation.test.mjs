import assert from "node:assert/strict";
import test from "node:test";
import { clampPage, pageHref } from "../../src/lib/business/list-page.mjs";
import { expensePercentage } from "../../src/lib/business/percentage.mjs";
import { parseTheme, themeColors } from "../../src/lib/app/theme.mjs";

test("filtered pagination canonicalizes empty, 25/26 boundaries and preserves filters", () => {
  assert.equal(clampPage(99, 0), 1);
  assert.equal(clampPage(99, 25), 1);
  assert.equal(clampPage(99, 26), 2);
  assert.equal(clampPage(2, 26), 2);
  assert.equal(pageHref("/notifications?unread=true&page=99", 2), "/notifications?unread=true&page=2");
  assert.equal(pageHref("/counterparties?q=t%C3%AAn&page=2", 1), "/counterparties?q=t%C3%AAn");
});
test("presentation percentages round integer ratios without truncating or settling money", () => {
  assert.equal(expensePercentage("0", "0"), "0");
  assert.equal(expensePercentage("0", "5"), "0");
  assert.equal(expensePercentage("1", "3"), "33.33");
  assert.equal(expensePercentage("1284500000", "1287325000"), "99.78");
  assert.equal(expensePercentage("100000", "1287325000"), "0.01");
  assert.equal(expensePercentage("9007199254740993", "9007199254740993"), "100");
  assert.equal(expensePercentage("99995", "100000"), "100");
});
test("invalid or missing theme is system, and manual meta colors ignore OS", () => {
  for (const value of [undefined, null, "", "invalid", "<script>", "system"]) assert.equal(parseTheme(value), "system");
  assert.deepEqual(themeColors("dark").map(item => item.color), ["#090d18", "#090d18"]);
  assert.deepEqual(themeColors("light").map(item => item.color), ["#f6f7fb", "#f6f7fb"]);
  assert.deepEqual(themeColors("system").map(item => item.color), ["#f6f7fb", "#090d18"]);
});

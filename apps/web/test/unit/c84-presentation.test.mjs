import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { clampPage, pageHref } from "../../src/lib/business/list-page.mjs";
import { barPercentage, expensePercentage } from "../../src/lib/business/percentage.mjs";
import { parseTheme, themeColors } from "../../src/lib/app/theme.mjs";

const webRoot = path.resolve(import.meta.dirname, "../..");
const [cashFlowSource, loanDetailSource, dashboardCss, workflowsCss] = await Promise.all([
  readFile(path.join(webRoot, "src/components/business/cash-flow-bars.tsx"), "utf8"),
  readFile(path.join(webRoot, "src/app/loans/[id]/page.tsx"), "utf8"),
  readFile(path.join(webRoot, "src/styles/dashboard.css"), "utf8"),
  readFile(path.join(webRoot, "src/styles/workflows.css"), "utf8"),
]);

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
test("chart bars keep tiny positive values visible without depicting zero as non-zero", () => {
  assert.equal(barPercentage("0", 1000n), "0%");
  assert.equal(barPercentage("1", 1000n), "2%");
  assert.equal(barPercentage("500", 1000n), "50%");
  assert.equal(barPercentage("1000", 1000n), "100%");
  assert.equal(barPercentage("1", 0n), "0%");
  assert.match(cashFlowSource, /data-zero=\{BigInt\(value\) === BigInt\(0\)\}/);
  assert.match(loanDetailSource, /data-zero=\{BigInt\(period\./);
  assert.match(dashboardCss, /\.cash-bar\[data-zero="true"\]\s*\{[^}]*min-height:\s*0/);
  assert.ok(dashboardCss.lastIndexOf('.cash-bar[data-zero="true"]') > dashboardCss.lastIndexOf('.cash-bar[data-series="outflow"]'));
  assert.match(workflowsCss, /\.period-bar-group > span\[data-zero="true"\]\s*\{[^}]*min-height:\s*0/);
});
test("invalid or missing theme is system, and manual meta colors ignore OS", () => {
  for (const value of [undefined, null, "", "invalid", "<script>", "system"]) assert.equal(parseTheme(value), "system");
  assert.deepEqual(themeColors("dark").map(item => item.color), ["#0b1220", "#0b1220"]);
  assert.deepEqual(themeColors("light").map(item => item.color), ["#eaf0f8", "#eaf0f8"]);
  assert.deepEqual(themeColors("system").map(item => item.color), ["#eaf0f8", "#0b1220"]);
});

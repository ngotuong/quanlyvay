import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const source = readFileSync(resolve(import.meta.dirname, "../../src/lib/business/dashboard-period.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const compiledModule = { exports: {} };
vm.runInNewContext(`(function (exports, require, module) { ${compiled}\n})(compiledModule.exports, require, compiledModule);`, {
  compiledModule,
  require: (specifier) => specifier === "./format" ? { todayInVietnam: () => "2026-09-10" } : require(specifier),
});
const { dashboardComparisonPeriods } = compiledModule.exports;

test("tháng đang chạy so sánh dòng tiền cùng số ngày tháng trước và số dư đầu kỳ", () => {
  assert.deepEqual(
    structuredClone(dashboardComparisonPeriods({ start: "2026-09-01", end: "2026-09-10", preset: "this_month" })),
    {
      flow: { start: "2026-08-01", end: "2026-08-10" },
      balance: { start: "2026-08-31", end: "2026-08-31" },
    },
  );
});

test("so sánh tháng tự chặn ngày cuối theo độ dài tháng", () => {
  assert.deepEqual(
    structuredClone(dashboardComparisonPeriods({ start: "2024-03-01", end: "2024-03-31", preset: "this_month" }).flow),
    { start: "2024-02-01", end: "2024-02-29" },
  );
});

test("lũy kế năm so sánh cùng kỳ năm trước, kể cả ngày nhuận", () => {
  assert.deepEqual(
    structuredClone(dashboardComparisonPeriods({ start: "2024-01-01", end: "2024-02-29", preset: "year_to_date" })),
    {
      flow: { start: "2023-01-01", end: "2023-02-28" },
      balance: { start: "2023-12-31", end: "2023-12-31" },
    },
  );
});

test("kỳ tùy chỉnh giữ quy tắc kỳ liền trước cùng độ dài", () => {
  assert.deepEqual(
    structuredClone(dashboardComparisonPeriods({ start: "2026-08-05", end: "2026-08-14", preset: "custom" })),
    {
      flow: { start: "2026-07-26", end: "2026-08-04" },
      balance: { start: "2026-08-04", end: "2026-08-04" },
    },
  );
});

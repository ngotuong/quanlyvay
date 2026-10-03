import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import vm from "node:vm";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const base = resolve(import.meta.dirname, "../../src");
function compile(source, globals = {}, imports = {}) {
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const moduleRecord = { exports: {} };
  vm.runInNewContext(`(function(exports,require,module){${output}\n})(module.exports,require,module)`, { module: moduleRecord, ...globals, require: name => imports[name] || require(name) });
  return moduleRecord.exports;
}
const load = (path, imports) => compile(readFileSync(resolve(base, path), "utf8"), {}, imports);
const privacy = load("components/app/privacy-provider.tsx");
const ui = load("components/ui/card.tsx", { "./utils": load("components/ui/utils.ts") });
const format = load("lib/business/format.ts");
const source = readFileSync(resolve(base, "app/loans/[id]/page.tsx"), "utf8");
const parsed = ts.createSourceFile("page.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const chart = parsed.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "PeriodInterestChart");
assert.ok(chart, "test must render the real production chart function");
const { Chart } = compile(`${chart.getText(parsed)}\nexports.Chart=PeriodInterestChart;`, { Card: ui.Card, PrivacyAmount: privacy.PrivacyAmount, ...format });

for (const count of [0, 1, 2, 3, 12]) test(`loan chart privacy covers ${count} period presentation branch`, () => {
  const periods = Array.from({ length: count }, (_, i) => ({ id: `synthetic-${i}`, end_date: "2026-09-30", accrued_interest_vnd: "1234567", interest_payments_vnd: "765432", closing_interest_balance_vnd: "469135" }));
  const render = hidden => renderToStaticMarkup(React.createElement(privacy.PrivacyProvider, { initialPrivacy: hidden }, React.createElement(privacy.PrivacyRegion, null, React.createElement(Chart, { periods }))));
  const visible = render(false);
  if (!count) assert.match(visible, /Chưa phát sinh kỳ lãi/);
  else if (count < 3) assert.match(visible, /period-summary-bar/);
  else assert.equal((visible.match(/class="period-chart-column"/g) || []).length, count);
  if (count) assert.match(visible, /1\.234\.567/);
  const hidden = render(true);
  assert.match(hidden, /Nội dung đang ẩn/);
  assert.doesNotMatch(hidden, /1\.234\.567|765\.432|469\.135|title=|period-chart/);
});

const bars = load("components/business/cash-flow-bars.tsx", { "@/components/app/privacy-provider": privacy, "@/lib/business/format": format });
const dashboardSource = readFileSync(resolve(base, "app/dashboard/page.tsx"), "utf8");
const dashboard = ts.createSourceFile("dashboard.tsx", dashboardSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const functions = ["CashFlowChart", "compactVnd", "monthLabel"].map(name => {
  const node = dashboard.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === name);
  assert.ok(node, `missing production function ${name}`);
  return node.getText(dashboard);
});
const { CashChart } = compile(`${functions.join("\n")}\nexports.CashChart=CashFlowChart;`, { Card: ui.Card, PrivacyAmount: privacy.PrivacyAmount, CashFlowBars: bars.CashFlowBars, ...format });
for (const [name, rows] of [
  ["empty", []],
  ["zero", [{ month: "2026-09", inflowVnd: "0", outflowVnd: "0", netVnd: "0" }]],
  ["mixed-zero/nonzero", [{ month: "2026-09", inflowVnd: "1234567", outflowVnd: "0", netVnd: "1234567" }]],
]) test(`cash chart privacy covers ${name} branch`, () => {
  const render = hidden => renderToStaticMarkup(React.createElement(privacy.PrivacyProvider, { initialPrivacy: hidden }, React.createElement(CashChart, { rows, periodLabel: "Synthetic" })));
  const visible = render(false);
  const hidden = render(true);
  if (name !== "mixed-zero/nonzero") {
    assert.match(visible, /Chưa có dòng tiền trong kỳ/);
    assert.match(hidden, /Chưa có dòng tiền trong kỳ/);
    assert.doesNotMatch(hidden, /chart-y-axis|cash-bar-control|role="tooltip"/);
  } else {
    assert.match(visible, /1\.234\.567/);
    assert.doesNotMatch(hidden, /1\.234\.567|0 ₫|1,2 tr|600 nghìn|cash-bar-control|role="tooltip"/);
    assert.equal((hidden.match(/>—<\/span>/g) || []).length, 3);
  }
});

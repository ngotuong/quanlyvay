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
  vm.runInNewContext(`(function(exports,require,module){${output}\n})(module.exports,require,module)`, { module: moduleRecord, URLSearchParams, ...globals, require: name => imports[name] || require(name) });
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
    assert.equal((hidden.match(/Nội dung đang ẩn/g) || []).length, 1);
  }
});

const bannerNode = dashboard.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "ActionHeroBanner");
assert.ok(bannerNode);
const { Banner } = compile(`${bannerNode.getText(dashboard)}\nexports.Banner=ActionHeroBanner;`, {
  PrivacyAmount: privacy.PrivacyAmount, ...format,
  Link: ({ children, ...props }) => React.createElement("a", props, children),
  CircleAlert: () => React.createElement("svg"), CalendarClock: () => React.createElement("svg"),
});
test("reminder banner clean, upcoming and overdue copy distinguishes schedule from transactions", () => {
  const reminderWindow = "03/10/2026–02/11/2026";
  const row = { direction: "LENDING", interestVnd: "1284500", principalVnd: "1284500000" };
  const render = (upcoming, overdue, hidden = false) => renderToStaticMarkup(React.createElement(privacy.PrivacyProvider, { initialPrivacy: hidden }, React.createElement(Banner, { upcoming, overdue, reminderWindow })));
  const clean = render([], []);
  assert.match(clean, /03\/10\/2026–02\/11\/2026/);
  assert.doesNotMatch(clean, /Tất cả các khoản vay đều đúng hạn|tháng này/);
  const upcoming = render([row], []);
  assert.match(upcoming, /1 lịch nhắc · 03\/10\/2026–02\/11\/2026/);
  assert.match(upcoming, /1 khoản phải thu/);
  assert.doesNotMatch(upcoming, /giao dịch|tháng này/);
  const overdue = render([], [row]);
  assert.match(overdue, /1 khoản quá hạn gốc/);
  assert.match(overdue, /href="\/loans\?status=OVERDUE"/);
  assert.match(overdue, /1\.284\.500\.000/);
  assert.doesNotMatch(render([row], [row], true), /1\.284\.500/);
});

// Render the actual server page with an empty query result; no DB rows are deleted.
test("loan list distinguishes an empty dataset from search no-results and viewer actions", async () => {
  const render = async (role, params) => {
    const page = load("app/loans/page.tsx", {
      "next/link": { __esModule: true, default: ({ children, ...props }) => React.createElement("a", props, children) },
      "@/components/business/pagination": { parsePage: () => 1, Pagination: () => null },
      "@/components/app/privacy-provider": privacy,
      "@/lib/auth/session": { requireAuthenticatedProfile: async () => ({ role }) },
      "@/components/business/loan-filters": { LoanFilters: () => null },
      "@/components/business/loan-card-link": { LoanCardLink: () => null },
      "@/lib/business/dashboard-period": { isValidBusinessDate: () => false },
      "@/lib/business/format": format,
      "@/lib/business/queries": { listLoans: async () => ({ items: [], totalCount: 0 }) },
      "@/components/ui": { Badge: () => null },
    });
    return renderToStaticMarkup(await page.default({ searchParams: Promise.resolve(params) }));
  };
  const empty = await render("OWNER", { status: "ALL" });
  assert.match(empty, /Chưa có khoản vay/);
  assert.match(empty, /href="\/counterparties"/);
  assert.match(empty, /href="\/loans\/new"/);
  assert.doesNotMatch(empty, /Xóa bộ lọc/);
  const searched = await render("OWNER", { status: "ALL", q: "không tồn tại" });
  assert.match(searched, /Không tìm thấy khoản phù hợp/);
  assert.match(searched, /Xóa bộ lọc/);
  assert.doesNotMatch(searched, /Chưa có khoản vay/);
  const viewer = await render("VIEWER", { status: "ALL" });
  assert.match(viewer, /Chưa có khoản vay/);
  assert.doesNotMatch(viewer, /Tạo khoản vay|Thêm đối tác/);
});

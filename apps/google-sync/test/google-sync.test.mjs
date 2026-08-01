import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

const appRoot = path.resolve(import.meta.dirname, "..");
const source = (await Promise.all(["Config.js", "Core.js", "Code.js"].map((file) => readFile(path.join(appRoot, "src", file), "utf8")))).join("\n");

class MockRange {
  constructor(sheet, row = 1, column = 1, rows = 1, columns = 1) { this.sheet = sheet; this.row = row; this.column = column; this.rows = rows; this.columns = columns; }
  setValues(values) { values.forEach((line, r) => line.forEach((value, c) => { this.sheet.cells[`${this.row + r},${this.column + c}`] = value; })); return this; }
  getValues() { return this.sheet.dataValues; }
  isBlank() { return this.sheet.dataValues.flat().every((value) => value === "" || value === null); }
  setBackground() { return this; } setFontColor() { return this; } setFontWeight() { return this; } setWrap() { return this; }
  setNumberFormat() { return this; } createFilter() { this.sheet.filterCount += 1; return this; } merge() { return this; } setFontSize() { return this; }
}
class MockSheet {
  constructor(name, dataValues = [[""]]) { this.name = name; this.dataValues = dataValues; this.cells = {}; this.clearCount = 0; this.filterCount = 0; }
  getName() { return this.name; } clear() { this.cells = {}; this.clearCount += 1; return this; }
  getRange(row, column, rows, columns) { return typeof row === "string" ? new MockRange(this) : new MockRange(this, row, column, rows, columns); }
  getFilter() { return this.filterCount ? { remove: () => { this.filterCount = 0; } } : null; }
  getDataRange() { return new MockRange(this); } setFrozenRows() { return this; } setHiddenGridlines() { return this; }
  autoResizeColumns() { return this; } setColumnWidth() { return this; }
}
class MockSpreadsheet {
  constructor(id = "target") { this.id = id; this.sheets = []; }
  getId() { return this.id; } getSheets() { return this.sheets; }
  getSheetByName(name) { return this.sheets.find((sheet) => sheet.name === name) || null; }
  insertSheet(name, index) { const sheet = new MockSheet(name); if (index === 0) this.sheets.unshift(sheet); else this.sheets.push(sheet); return sheet; }
  deleteSheet(sheet) { this.sheets = this.sheets.filter((candidate) => candidate !== sheet); }
}

function makeContext(overrides = {}) {
  const context = vm.createContext({ console, Date, JSON, Number, String, Error, encodeURIComponent, ...overrides });
  vm.runInContext(source, context);
  return context;
}
function call(context, expression) { return vm.runInContext(expression, context); }

test("sheet contract includes every reconciliation dataset", () => {
  const context = makeContext();
  assert.deepEqual(Array.from(call(context, "SYNC_SHEETS.map(item => item.name)")), ["Đối tác", "Khoản vay", "Giao dịch", "Sự kiện", "Kỳ lãi", "Chi phí", "Thông báo", "Lịch sử"]);
});

test("row mapping keeps IDs as text and VND as numeric when safe", () => {
  const context = makeContext();
  const row = call(context, `buildSheetRows_(SYNC_SHEETS[1], [{id:"loan-1",original_principal_vnd:"10000000"}])[0]`);
  assert.equal(row[0], "loan-1"); assert.equal(row[5], 10000000);
});

test("unsafe VND integers remain text to avoid JavaScript precision loss", () => {
  const context = makeContext();
  assert.equal(call(context, `normalizeCell_("9007199254740993", "money")`), "9007199254740993");
});

test("export URL carries encoded incremental cursor", () => {
  const context = makeContext();
  assert.equal(call(context, `buildExportUrl_("https://example.test/", "2026-08-01T10:00:00+00:00")`), "https://example.test/api/google-sync/export?cursor=2026-08-01T10%3A00%3A00%2B00%3A00");
});

test("payload validation rejects wrong schema", () => {
  const context = makeContext();
  assert.throws(() => call(context, `validatePayload_({schemaVersion:2,sourceVersion:"x"})`), /không hợp lệ/);
});

test("retention keeps newest 12 weekly snapshots", () => {
  const context = makeContext();
  context.snapshots = Array.from({ length: 15 }, (_, index) => ({ id: `s${index}`, createdAt: new Date(2026, 0, index + 1) }));
  assert.deepEqual(Array.from(call(context, `selectSnapshotIdsToTrash_(snapshots, 12)`)), ["s2", "s1", "s0"]);
});

test("full snapshot writes overview and all data tabs idempotently", () => {
  const spreadsheet = new MockSpreadsheet();
  const context = makeContext(); context.spreadsheet = spreadsheet;
  context.payload = { schemaVersion: 1, sourceVersion: "v1", generatedAt: "2026-08-01T00:00:00Z", tables: { counterparties: [{ id: "c1", name: "A" }], loans: [], transactions: [], lifecycleEvents: [], interestPeriods: [], expenses: [], notifications: [], auditLogs: [] } };
  call(context, "applyPayloadToSpreadsheet_(spreadsheet, payload)");
  call(context, "applyPayloadToSpreadsheet_(spreadsheet, payload)");
  assert.equal(spreadsheet.sheets.length, 9);
  assert.equal(spreadsheet.getSheetByName("Đối tác").cells["2,1"], "c1");
  assert.equal(spreadsheet.getSheetByName("Đối tác").clearCount, 2);
  assert.equal(spreadsheet.getSheetByName("Đối tác").filterCount, 1);
});

test("sync stores source cursor then skips unchanged payload", () => {
  const spreadsheet = new MockSpreadsheet(); const values = new Map(); let fetchCount = 0;
  const payloads = [
    { schemaVersion: 1, sourceVersion: "v1", generatedAt: "2026-08-01T00:00:00Z", unchanged: false, tables: { counterparties: [], loans: [], transactions: [], lifecycleEvents: [], interestPeriods: [], expenses: [], notifications: [], auditLogs: [] } },
    { schemaVersion: 1, sourceVersion: "v1", unchanged: true },
  ];
  const context = makeContext({
    SpreadsheetApp: { getActive: () => spreadsheet }, LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => values.get(key) || (key === "SYNC_API_URL" ? "https://sync.test" : key === "SYNC_API_SECRET" ? "secret" : ""), setProperty: (key, value) => values.set(key, value) }) },
    UrlFetchApp: { fetch: (_url, options) => { assert.equal(options.headers["x-sync-secret"], "secret"); const body = payloads[fetchCount++]; return { getResponseCode: () => 200, getContentText: () => JSON.stringify(body) }; } },
  });
  assert.equal(call(context, "runGoogleSheetSync()").unchanged, false);
  assert.equal(values.get("SYNC_CURSOR"), "v1");
  assert.equal(call(context, "runGoogleSheetSync()").unchanged, true);
});

test("restore copies snapshot values without any Supabase write path", () => {
  const sourceBook = new MockSpreadsheet("snapshot"); sourceBook.sheets.push(new MockSheet("Đối tác", [["ID", "Tên"], ["c1", "Bản sao"]]));
  const targetBook = new MockSpreadsheet("live");
  const context = makeContext({ SpreadsheetApp: { openById: (id) => { assert.equal(id, "snapshot"); return sourceBook; }, getActive: () => targetBook } });
  const result = call(context, `restoreSnapshotById("snapshot")`);
  assert.equal(result.sheetCount, 1); assert.equal(targetBook.getSheetByName("Đối tác").cells["2,2"], "Bản sao");
});

test("infrastructure setup is idempotent for folders and managed triggers", () => {
  const spreadsheet = new MockSpreadsheet("bound-sheet"); spreadsheet.sheets.push(new MockSheet("Sheet1"));
  const values = new Map(); let folderCreates = 0; let triggers = [];
  const triggerBuilder = (handler) => ({
    timeBased() { return this; }, everyHours() { return this; }, onWeekDay() { return this; }, atHour() { return this; },
    create() { const trigger = { getHandlerFunction: () => handler }; triggers.push(trigger); return trigger; },
  });
  const context = makeContext({
    SpreadsheetApp: { getActive: () => spreadsheet },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => values.get(key) || "", setProperty: (key, value) => values.set(key, value) }) },
    DriveApp: { createFolder: (name) => { assert.equal(name, "QuanLyVayCaNhan_Backups"); folderCreates += 1; return { getId: () => "folder-1" }; } },
    ScriptApp: {
      WeekDay: { SUNDAY: "SUNDAY" }, getProjectTriggers: () => triggers.slice(),
      deleteTrigger: (trigger) => { triggers = triggers.filter((candidate) => candidate !== trigger); }, newTrigger: triggerBuilder,
    },
  });
  assert.equal(call(context, "installGoogleSyncInfrastructure()").triggerCount, 2);
  assert.equal(call(context, "installGoogleSyncInfrastructure()").backupFolderId, "folder-1");
  assert.equal(folderCreates, 1); assert.equal(triggers.length, 2); assert.equal(spreadsheet.sheets.length, 9);
  assert.equal(spreadsheet.getSheetByName("Sheet1"), null);
});

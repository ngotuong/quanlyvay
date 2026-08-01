function onOpen() {
  SpreadsheetApp.getUi().createMenu("Quản Lý Vay")
    .addItem("Đồng bộ ngay", "runGoogleSheetSync")
    .addItem("Tạo snapshot tuần", "runWeeklySnapshot")
    .addToUi();
}

/**
 * One-time, idempotent setup for the bound reconciliation workbook.
 * Creates only local Google resources; it never writes to Supabase.
 */
function installGoogleSyncInfrastructure() {
  const spreadsheet = SpreadsheetApp.getActive();
  const initialSheets = spreadsheet.getSheets();
  const placeholder = initialSheets.length === 1 &&
    SYNC_SHEETS.every(function (definition) { return definition.name !== initialSheets[0].getName(); }) &&
    initialSheets[0].getName() !== "Tổng quan" && initialSheets[0].getDataRange().isBlank()
    ? initialSheets[0] : null;

  applyPayloadToSpreadsheet_(spreadsheet, {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    sourceVersion: "not-synced",
    unchanged: false,
    tables: {},
  });
  if (placeholder) spreadsheet.deleteSheet(placeholder);

  const properties = PropertiesService.getScriptProperties();
  let folderId = properties.getProperty("BACKUP_FOLDER_ID");
  if (!folderId) {
    const folder = DriveApp.createFolder(BACKUP_FOLDER_NAME);
    folderId = folder.getId();
    properties.setProperty("BACKUP_FOLDER_ID", folderId);
  }

  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (MANAGED_TRIGGER_HANDLERS.indexOf(trigger.getHandlerFunction()) !== -1) ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger("runGoogleSheetSync").timeBased().everyHours(1).create();
  ScriptApp.newTrigger("runWeeklySnapshot").timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).create();

  return { spreadsheetId: spreadsheet.getId(), backupFolderId: folderId, triggerCount: 2 };
}

function runGoogleSheetSync() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const properties = PropertiesService.getScriptProperties();
    const baseUrl = properties.getProperty("SYNC_API_URL");
    const secret = properties.getProperty("SYNC_API_SECRET");
    if (!baseUrl || !secret) throw new Error("Thiếu SYNC_API_URL hoặc SYNC_API_SECRET trong Script Properties.");
    const cursor = properties.getProperty("SYNC_CURSOR") || "";
    const response = UrlFetchApp.fetch(buildExportUrl_(baseUrl, cursor), {
      method: "get",
      headers: { "x-sync-secret": secret },
      muteHttpExceptions: true,
    });
    if (response.getResponseCode() !== 200) throw new Error("Export API trả về HTTP " + response.getResponseCode() + ".");
    const payload = validatePayload_(JSON.parse(response.getContentText()));
    if (payload.unchanged) return { unchanged: true, sourceVersion: payload.sourceVersion };
    applyPayloadToSpreadsheet_(SpreadsheetApp.getActive(), payload);
    properties.setProperty("SYNC_CURSOR", payload.sourceVersion);
    properties.setProperty("LAST_SYNC_AT", new Date().toISOString());
    return { unchanged: false, sourceVersion: payload.sourceVersion };
  } finally {
    lock.releaseLock();
  }
}

/** @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet @param {*} payload */
function applyPayloadToSpreadsheet_(spreadsheet, payload) {
  SYNC_SHEETS.forEach(function (definition) {
    const sheet = spreadsheet.getSheetByName(definition.name) || spreadsheet.insertSheet(definition.name);
    const rows = buildSheetRows_(definition, payload.tables[definition.table] || []);
    sheet.clear();
    sheet.getRange(1, 1, 1, definition.headers.length).setValues([definition.headers]);
    if (rows.length) sheet.getRange(2, 1, rows.length, definition.headers.length).setValues(rows);
    formatDataSheet_(sheet, definition, rows.length);
  });
  writeOverview_(spreadsheet, payload);
}

/** @param {GoogleAppsScript.Spreadsheet.Sheet} sheet @param {SyncSheetDefinition} definition @param {number} rowCount */
function formatDataSheet_(sheet, definition, rowCount) {
  const existingFilter = sheet.getFilter();
  if (existingFilter) existingFilter.remove();
  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);
  sheet.getRange(1, 1, 1, definition.headers.length).setBackground("#164E63").setFontColor("#FFFFFF").setFontWeight("bold").setWrap(true);
  definition.types.forEach(function (type, index) {
    if (!rowCount) return;
    const range = sheet.getRange(2, index + 1, rowCount, 1);
    if (type === "money" || type === "integer") range.setNumberFormat("#,##0;[Red](#,##0);-");
    if (type === "rate") range.setNumberFormat("0.0000000000");
    if (type === "date") range.setNumberFormat("yyyy-mm-dd");
    if (type === "datetime") range.setNumberFormat("yyyy-mm-dd hh:mm:ss");
    if (type === "text") range.setNumberFormat("@");
  });
  sheet.autoResizeColumns(1, definition.headers.length);
  sheet.getRange(1, 1, Math.max(rowCount + 1, 1), definition.headers.length).createFilter();
}

/** @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet @param {*} payload */
function writeOverview_(spreadsheet, payload) {
  const sheet = spreadsheet.getSheetByName("Tổng quan") || spreadsheet.insertSheet("Tổng quan", 0);
  sheet.clear();
  const rows = [["QUẢN LÝ VAY — BẢN ĐỐI CHIẾU", ""], ["Nguồn chuẩn", "Supabase (Sheet chỉ đọc/đối chiếu)"], ["Phiên bản nguồn", payload.sourceVersion], ["Xuất lúc", new Date(payload.generatedAt)], ["Số tab dữ liệu", SYNC_SHEETS.length]];
  SYNC_SHEETS.forEach(function (definition) { rows.push([definition.name, (payload.tables[definition.table] || []).length]); });
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange("A1:B1").merge().setBackground("#164E63").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(16);
  sheet.getRange(2, 1, rows.length - 1, 1).setFontWeight("bold");
  sheet.getRange("B4").setNumberFormat("yyyy-mm-dd hh:mm:ss");
  sheet.setColumnWidth(1, 190); sheet.setColumnWidth(2, 360); sheet.setHiddenGridlines(true); sheet.setFrozenRows(1);
}

function runWeeklySnapshot() {
  const properties = PropertiesService.getScriptProperties();
  const folderId = properties.getProperty("BACKUP_FOLDER_ID");
  if (!folderId) throw new Error("Thiếu BACKUP_FOLDER_ID trong Script Properties.");
  const now = new Date();
  const weekKey = Utilities.formatDate(now, SYNC_TIME_ZONE, "YYYY-'W'ww");
  if (properties.getProperty("LAST_SNAPSHOT_WEEK") === weekKey) return { unchanged: true, weekKey: weekKey };
  const spreadsheet = SpreadsheetApp.getActive();
  const folder = DriveApp.getFolderById(folderId);
  const name = SNAPSHOT_PREFIX + Utilities.formatDate(now, SYNC_TIME_ZONE, "yyyy-MM-dd");
  DriveApp.getFileById(spreadsheet.getId()).makeCopy(name, folder);
  purgeOldSnapshots_(folder);
  properties.setProperty("LAST_SNAPSHOT_WEEK", weekKey);
  return { unchanged: false, weekKey: weekKey };
}

/** @param {GoogleAppsScript.Drive.Folder} folder */
function purgeOldSnapshots_(folder) {
  const files = folder.getFiles();
  /** @type {{id:string, createdAt:GoogleAppsScript.Base.Date}[]} */
  const snapshots = [];
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().indexOf(SNAPSHOT_PREFIX) === 0) snapshots.push({ id: file.getId(), createdAt: file.getDateCreated() });
  }
  selectSnapshotIdsToTrash_(snapshots, SNAPSHOT_RETENTION).forEach(function (id) { DriveApp.getFileById(id).setTrashed(true); });
}

/** Restore snapshot data into the active comparison workbook. Never writes to Supabase. @param {string} snapshotSpreadsheetId */
function restoreSnapshotById(snapshotSpreadsheetId) {
  if (!snapshotSpreadsheetId) throw new Error("Cần snapshotSpreadsheetId.");
  const source = SpreadsheetApp.openById(snapshotSpreadsheetId);
  const target = SpreadsheetApp.getActive();
  source.getSheets().forEach(function (sourceSheet) {
    const targetSheet = target.getSheetByName(sourceSheet.getName()) || target.insertSheet(sourceSheet.getName());
    const values = sourceSheet.getDataRange().getValues();
    targetSheet.clear();
    if (values.length && values[0].length) targetSheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  });
  return { restoredFrom: snapshotSpreadsheetId, sheetCount: source.getSheets().length };
}

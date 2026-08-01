/** @param {*} value @param {string} type @returns {*} */
function normalizeCell_(value, type) {
  if (value === null || value === undefined) return "";
  if (type === "integer" || type === "rate") return Number(value);
  if (type === "money") {
    const amount = Number(value);
    return Number.isSafeInteger(amount) ? amount : String(value);
  }
  if (type === "date") return new Date(String(value).slice(0, 10) + "T00:00:00+07:00");
  if (type === "datetime") return new Date(String(value));
  return String(value);
}

/** @param {SyncSheetDefinition} definition @param {Record<string, *>[]} records */
function buildSheetRows_(definition, records) {
  return records.map(function (record) {
    return definition.fields.map(function (field, index) {
      return normalizeCell_(record[field], definition.types[index]);
    });
  });
}

/** @param {*} payload */
function validatePayload_(payload) {
  if (!payload || payload.schemaVersion !== 1 || typeof payload.sourceVersion !== "string") throw new Error("Payload đồng bộ không hợp lệ.");
  if (!payload.unchanged && (!payload.tables || typeof payload.tables !== "object")) throw new Error("Payload thiếu dữ liệu bảng.");
  return payload;
}

/** @param {string} baseUrl @param {string} cursor */
function buildExportUrl_(baseUrl, cursor) {
  const clean = baseUrl.replace(/\/$/, "");
  return clean + "/api/google-sync/export" + (cursor ? "?cursor=" + encodeURIComponent(cursor) : "");
}

/** @param {{id:string, createdAt:{getTime: function(): number}}[]} snapshots @param {number} retention */
function selectSnapshotIdsToTrash_(snapshots, retention) {
  return snapshots.slice().sort(function (a, b) { return b.createdAt.getTime() - a.createdAt.getTime(); }).slice(retention).map(function (item) { return item.id; });
}

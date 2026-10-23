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
  const text = String(value);
  return type === "text" && /^[=+\-@]/.test(text) ? "'" + text : text;
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
  if (!payload || payload.schemaVersion !== 3 || typeof payload.sourceVersion !== "string" || !payload.sourceVersion.trim()) {
    throw new Error("Payload đồng bộ không hợp lệ.");
  }
  if (payload.unchanged) return payload;
  if (!payload.tables || typeof payload.tables !== "object" || Array.isArray(payload.tables)) {
    throw new Error("Payload thiếu dữ liệu bảng.");
  }
  if (typeof payload.generatedAt !== "string" || !payload.generatedAt || Number.isNaN(Date.parse(payload.generatedAt))) {
    throw new Error("Payload có thời điểm xuất không hợp lệ.");
  }
  SYNC_SHEETS.forEach(function (definition) {
    const records = payload.tables[definition.table];
    if (!Array.isArray(records) || records.some(function (record) {
      return !record || typeof record !== "object" || Array.isArray(record);
    })) {
      throw new Error("Payload bảng " + definition.table + " không hợp lệ.");
    }
  });
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

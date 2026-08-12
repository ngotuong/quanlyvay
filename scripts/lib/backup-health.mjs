import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { realpath, stat } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";

export const MANIFEST_FORMAT = "QLV_BACKUP_MANIFEST_V1";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function assertNonEmptyString(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} phải là chuỗi không rỗng.`);
  }
  return value.trim();
}

function parseTimestamp(value, field) {
  const timestamp = Date.parse(assertNonEmptyString(value, field));
  if (!Number.isFinite(timestamp)) throw new Error(`${field} không phải thời điểm ISO hợp lệ.`);
  return timestamp;
}

function resolveManifestFile(manifestPath, relativePath) {
  const normalized = assertNonEmptyString(relativePath, "files[].path");
  const base = resolve(dirname(manifestPath));
  const target = resolve(base, normalized);
  if (target !== base && !target.startsWith(`${base}${sep}`)) {
    throw new Error(`Đường dẫn backup vượt khỏi thư mục manifest: ${normalized}`);
  }
  if (target === base) throw new Error("Đường dẫn backup không được trỏ tới thư mục manifest.");
  return target;
}

async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function assertRealPathInside(basePath, targetPath) {
  const [base, target] = await Promise.all([realpath(basePath), realpath(targetPath)]);
  if (target !== base && !target.startsWith(`${base}${sep}`)) {
    throw new Error(`File backup thực tế vượt khỏi thư mục manifest: ${targetPath}`);
  }
  return target;
}

export async function createBackupManifest({
  manifestPath,
  backupId,
  createdAt = new Date().toISOString(),
  projectRef,
  migrationVersion,
  filePaths,
  rowCounts,
}) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    throw new Error("Cần ít nhất một file ciphertext để tạo manifest.");
  }
  const base = await realpath(resolve(dirname(manifestPath)));
  const files = [];
  for (const filePath of filePaths) {
    const target = await assertRealPathInside(base, resolve(filePath));
    const metadata = await stat(target);
    if (!metadata.isFile()) throw new Error(`Không phải file backup: ${filePath}`);
    const path = relative(base, target);
    files.push({ path, sizeBytes: metadata.size, sha256: await sha256File(target) });
  }

  const result = {
    format: MANIFEST_FORMAT,
    backupId,
    createdAt,
    projectRef,
    migrationVersion,
    files,
    ...(rowCounts ? { rowCounts } : {}),
  };
  return validateManifestShape(result);
}

export function validateManifestShape(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Manifest phải là một JSON object.");
  }
  if (manifest.format !== MANIFEST_FORMAT) {
    throw new Error(`Manifest phải dùng format ${MANIFEST_FORMAT}.`);
  }

  assertNonEmptyString(manifest.backupId, "backupId");
  parseTimestamp(manifest.createdAt, "createdAt");
  assertNonEmptyString(manifest.projectRef, "projectRef");
  assertNonEmptyString(manifest.migrationVersion, "migrationVersion");

  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    throw new Error("Manifest phải có ít nhất một ciphertext trong files.");
  }

  const paths = new Set();
  for (const [index, file] of manifest.files.entries()) {
    if (!file || typeof file !== "object" || Array.isArray(file)) {
      throw new Error(`files[${index}] không hợp lệ.`);
    }
    const path = assertNonEmptyString(file.path, `files[${index}].path`);
    if (!path.endsWith(".qlvbak")) {
      throw new Error(`files[${index}].path phải trỏ tới ciphertext .qlvbak.`);
    }
    if (paths.has(path)) throw new Error(`Manifest chứa file trùng: ${path}`);
    paths.add(path);
    if (!Number.isSafeInteger(file.sizeBytes) || file.sizeBytes <= 0) {
      throw new Error(`files[${index}].sizeBytes phải là số nguyên dương.`);
    }
    if (typeof file.sha256 !== "string" || !SHA256_PATTERN.test(file.sha256)) {
      throw new Error(`files[${index}].sha256 phải là SHA-256 chữ thường.`);
    }
  }

  if (manifest.rowCounts !== undefined) {
    if (!manifest.rowCounts || typeof manifest.rowCounts !== "object" || Array.isArray(manifest.rowCounts)) {
      throw new Error("rowCounts phải là object nếu được khai báo.");
    }
    for (const [table, count] of Object.entries(manifest.rowCounts)) {
      assertNonEmptyString(table, "rowCounts table");
      if (!Number.isSafeInteger(count) || count < 0) {
        throw new Error(`rowCounts.${table} phải là số nguyên không âm.`);
      }
    }
  }

  return manifest;
}

export async function verifyBackupManifest({
  manifest,
  manifestPath,
  expectedProjectRef,
  maxAgeHours = 24,
  now = new Date(),
}) {
  validateManifestShape(manifest);
  if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0) {
    throw new Error("maxAgeHours phải là số dương.");
  }
  if (expectedProjectRef && manifest.projectRef !== expectedProjectRef) {
    throw new Error(`Sai project ref: nhận ${manifest.projectRef}, cần ${expectedProjectRef}.`);
  }

  const createdAtMs = parseTimestamp(manifest.createdAt, "createdAt");
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(nowMs)) throw new Error("Thời điểm kiểm tra không hợp lệ.");
  const ageHours = (nowMs - createdAtMs) / 3_600_000;
  if (ageHours < -5 / 60) throw new Error("Manifest có createdAt nằm trong tương lai.");
  if (ageHours > maxAgeHours) {
    throw new Error(`Backup đã quá RPO: ${ageHours.toFixed(2)} giờ > ${maxAgeHours} giờ.`);
  }

  const checkedFiles = [];
  for (const file of manifest.files) {
    const path = await assertRealPathInside(dirname(manifestPath), resolveManifestFile(manifestPath, file.path));
    const metadata = await stat(path);
    if (!metadata.isFile()) throw new Error(`Không phải file backup: ${file.path}`);
    if (metadata.size !== file.sizeBytes) {
      throw new Error(`Sai kích thước ${file.path}: nhận ${metadata.size}, cần ${file.sizeBytes}.`);
    }
    const checksum = await sha256File(path);
    if (checksum !== file.sha256) throw new Error(`Sai SHA-256: ${file.path}`);
    checkedFiles.push({ path: file.path, sizeBytes: metadata.size, sha256: checksum });
  }

  return {
    ok: true,
    backupId: manifest.backupId,
    projectRef: manifest.projectRef,
    migrationVersion: manifest.migrationVersion,
    ageHours,
    checkedFiles,
  };
}

function dateKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 10);
}

function monthKey(timestamp) {
  return new Date(timestamp).toISOString().slice(0, 7);
}

function isoWeekKey(timestamp) {
  const date = new Date(timestamp);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86_400_000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function selectNewestDistinct(backups, keyFn, limit) {
  const selected = new Set();
  const seen = new Set();
  for (const backup of backups) {
    const key = keyFn(backup.createdAtMs);
    if (seen.has(key)) continue;
    seen.add(key);
    selected.add(backup.backupId);
    if (seen.size >= limit) break;
  }
  return selected;
}

export function planRetention(manifests, { daily = 7, weekly = 4, monthly = 12 } = {}) {
  for (const [name, value] of Object.entries({ daily, weekly, monthly })) {
    if (!Number.isSafeInteger(value) || value < 0) throw new Error(`${name} phải là số nguyên không âm.`);
  }

  const backups = manifests.map((manifest) => {
    validateManifestShape(manifest);
    return {
      backupId: manifest.backupId,
      createdAt: manifest.createdAt,
      createdAtMs: parseTimestamp(manifest.createdAt, "createdAt"),
    };
  }).sort((a, b) => b.createdAtMs - a.createdAtMs || a.backupId.localeCompare(b.backupId));

  if (new Set(backups.map((backup) => backup.backupId)).size !== backups.length) {
    throw new Error("Danh sách retention chứa backupId trùng.");
  }

  const keepIds = new Set([
    ...selectNewestDistinct(backups, dateKey, daily),
    ...selectNewestDistinct(backups, isoWeekKey, weekly),
    ...selectNewestDistinct(backups, monthKey, monthly),
  ]);

  return {
    keep: backups.filter((backup) => keepIds.has(backup.backupId)).map(({ createdAtMs: _, ...backup }) => backup),
    candidates: backups.filter((backup) => !keepIds.has(backup.backupId)).map(({ createdAtMs: _, ...backup }) => backup),
  };
}

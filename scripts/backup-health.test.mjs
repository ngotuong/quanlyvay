import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createBackupManifest, MANIFEST_FORMAT, planRetention, verifyBackupManifest } from "./lib/backup-health.mjs";

function manifest(overrides = {}) {
  return {
    format: MANIFEST_FORMAT,
    backupId: "qlv-test-20260812T120000Z",
    createdAt: "2026-08-12T12:00:00.000Z",
    projectRef: "hmfxnstrqfqpvsgfmjmd",
    migrationVersion: "20260812100000",
    files: [],
    rowCounts: { profiles: 2, loans: 22, transactions: 209 },
    ...overrides,
  };
}

test("verify accepts a fresh manifest with matching size and SHA-256", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qlv-backup-health-"));
  try {
    const content = Buffer.from("synthetic encrypted backup", "utf8");
    const backupPath = join(directory, "app-data.sql.qlvbak");
    const manifestPath = join(directory, "backup.manifest.json");
    await writeFile(backupPath, content, { mode: 0o600 });
    const backupManifest = manifest({
      files: [{
        path: "app-data.sql.qlvbak",
        sizeBytes: content.length,
        sha256: createHash("sha256").update(content).digest("hex"),
      }],
    });
    await writeFile(manifestPath, JSON.stringify(backupManifest));

    const result = await verifyBackupManifest({
      manifest: backupManifest,
      manifestPath,
      expectedProjectRef: "hmfxnstrqfqpvsgfmjmd",
      maxAgeHours: 24,
      now: new Date("2026-08-13T11:59:00.000Z"),
    });
    assert.equal(result.ok, true);
    assert.equal(result.checkedFiles.length, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("create builds a reproducible manifest without reading outside its directory", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qlv-backup-create-"));
  try {
    const backupPath = join(directory, "app-data.sql.qlvbak");
    await writeFile(backupPath, "ciphertext", { mode: 0o600 });
    const created = await createBackupManifest({
      manifestPath: join(directory, "backup.manifest.json"),
      backupId: "backup-create",
      createdAt: "2026-08-12T12:00:00.000Z",
      projectRef: "hmfxnstrqfqpvsgfmjmd",
      migrationVersion: "20260812100000",
      filePaths: [backupPath],
      rowCounts: { loans: 22 },
    });
    assert.equal(created.files[0].path, "app-data.sql.qlvbak");
    assert.equal(created.files[0].sizeBytes, 10);
    assert.equal(created.rowCounts.loans, 22);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("CLI create resolves a ciphertext path without forwarding Array.map metadata", async () => {
  const directory = await mkdtemp(join(tmpdir(), "qlv-backup-cli-create-"));
  try {
    const backupPath = join(directory, "core.sql.qlvbak");
    const manifestPath = join(directory, "backup.manifest.json");
    await writeFile(backupPath, "ciphertext", { mode: 0o600 });

    const result = spawnSync(process.execPath, [
      new URL("./backup-health.mjs", import.meta.url).pathname,
      "create",
      "--output", manifestPath,
      "--backup-id", "backup-cli-create",
      "--created-at", "2026-08-12T12:00:00.000Z",
      "--project-ref", "hmfxnstrqfqpvsgfmjmd",
      "--migration-version", "20260812100000",
      "--file", backupPath,
      "--row-count", "loans=22",
    ], { encoding: "utf8" });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /"ok": true/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("verify fails closed when backup exceeds RPO", async () => {
  await assert.rejects(
    verifyBackupManifest({
      manifest: manifest({ files: [{ path: "missing.qlvbak", sizeBytes: 1, sha256: "a".repeat(64) }] }),
      manifestPath: "/tmp/backup.manifest.json",
      expectedProjectRef: "hmfxnstrqfqpvsgfmjmd",
      maxAgeHours: 24,
      now: new Date("2026-08-13T12:00:01.000Z"),
    }),
    /quá RPO/,
  );
});

test("verify rejects traversal before reading a ciphertext", async () => {
  await assert.rejects(
    verifyBackupManifest({
      manifest: manifest({ files: [{ path: "../secret.qlvbak", sizeBytes: 1, sha256: "a".repeat(64) }] }),
      manifestPath: "/tmp/backup/backup.manifest.json",
      expectedProjectRef: "hmfxnstrqfqpvsgfmjmd",
      now: new Date("2026-08-12T12:01:00.000Z"),
    }),
    /vượt khỏi thư mục manifest/,
  );
});

test("retention is a deterministic union of daily, weekly and monthly evidence", () => {
  const manifests = [
    "2026-08-12T12:00:00.000Z",
    "2026-08-11T12:00:00.000Z",
    "2026-08-10T12:00:00.000Z",
    "2026-08-03T12:00:00.000Z",
    "2026-07-15T12:00:00.000Z",
    "2026-06-15T12:00:00.000Z",
  ].map((createdAt, index) => manifest({
    backupId: `backup-${index}`,
    createdAt,
    files: [{ path: `backup-${index}.qlvbak`, sizeBytes: 1, sha256: "a".repeat(64) }],
  }));

  const result = planRetention(manifests, { daily: 2, weekly: 2, monthly: 2 });
  assert.deepEqual(result.keep.map((item) => item.backupId), ["backup-0", "backup-1", "backup-3", "backup-4"]);
  assert.deepEqual(result.candidates.map((item) => item.backupId), ["backup-2", "backup-5"]);
});

test("retention rejects duplicate backup IDs", () => {
  const duplicate = manifest({ files: [{ path: "one.qlvbak", sizeBytes: 1, sha256: "a".repeat(64) }] });
  assert.throws(() => planRetention([duplicate, duplicate]), /backupId trùng/);
});

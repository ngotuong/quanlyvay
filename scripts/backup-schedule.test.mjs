import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { backupAgeHours, discoverBackupManifests, newestBackup } from "./lib/backup-schedule.mjs";

test("backup discovery reads nested immutable backup directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "qlv-backup-schedule-"));
  try {
    await mkdir(join(root, "qlv-prod-new"));
    await mkdir(join(root, ".partial"));
    await writeFile(join(root, "qlv-prod-new", "backup.manifest.json"), "{}");
    await writeFile(join(root, ".partial", "backup.manifest.json"), "{}");
    assert.deepEqual(await discoverBackupManifests(root), [join(root, "qlv-prod-new", "backup.manifest.json")]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("newest backup and age use manifest creation time", () => {
  const entries = [
    { manifest: { createdAt: "2026-09-25T00:00:00Z" } },
    { manifest: { createdAt: "2026-09-25T10:00:00Z" } },
  ];
  assert.equal(newestBackup(entries), entries[1]);
  assert.equal(backupAgeHours(entries[1].manifest, new Date("2026-09-26T06:00:00Z")), 20);
});

#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { mkdir, rename, rm } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createBackupManifest, planRetention, verifyBackupManifest } from "./lib/backup-health.mjs";
import { backupAgeHours, newestBackup, readBackupManifests } from "./lib/backup-schedule.mjs";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const backupRoot = join(repositoryRoot, ".backups");
const projectRef = "hmfxnstrqfqpvsgfmjmd";
const keychainService = "com.ngotuong.quanlyvay.backup";
const thresholdHours = Number(process.env.QLV_BACKUP_THRESHOLD_HOURS ?? 20);
const command = process.argv[2] ?? "ensure";

function fail(message) {
  throw new Error(message);
}

function safeRun(executable, args, options = {}) {
  const result = spawnSync(executable, args, { cwd: repositoryRoot, encoding: "utf8", ...options });
  if (result.status !== 0) fail(`${executable} thất bại: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  return result.stdout.trim();
}

async function encryptedDump(args, output, key) {
  const dump = spawnSync("supabase", ["db", "dump", "--linked", ...args, "--file", "/dev/stdout"], {
    cwd: repositoryRoot,
    encoding: null,
    maxBuffer: 100 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (dump.status !== 0) fail(`Dump thất bại: ${dump.stderr.toString("utf8").trim()}`);
  const plaintext = dump.stdout;
  try {
    const encrypt = spawnSync(process.execPath, [join(repositoryRoot, "scripts/backup-crypto.mjs"), "encrypt", "-", output], {
      cwd: repositoryRoot,
      env: { ...process.env, QLV_BACKUP_KEY_BASE64: key },
      input: plaintext,
      encoding: null,
      maxBuffer: 100 * 1024 * 1024,
      stdio: ["pipe", "ignore", "pipe"],
    });
    if (encrypt.status !== 0) fail(`Mã hóa dump thất bại: ${encrypt.stderr.toString("utf8").trim()}`);
  } finally {
    plaintext.fill(0);
  }
}

async function verifyCiphertext(path, kind, key) {
  const commandLine = `set -o pipefail; node scripts/backup-crypto.mjs decrypt "$QLV_BACKUP_INPUT" - | node scripts/backup-sql-gate.mjs ${kind}`;
  const result = spawnSync("/bin/zsh", ["-c", commandLine], {
    cwd: repositoryRoot,
    env: { ...process.env, QLV_BACKUP_KEY_BASE64: key, QLV_BACKUP_INPUT: path },
    encoding: "utf8",
    stdio: ["ignore", "ignore", "pipe"],
  });
  if (result.status !== 0) fail(`GCM/SQL gate thất bại cho ${path}: ${result.stderr.trim()}`);
}

function latestMigration() {
  const raw = safeRun("supabase", ["migration", "list", "--linked"]);
  const payload = JSON.parse(raw.slice(raw.indexOf("{")));
  const versions = payload.migrations.map((row) => row.remote).filter(Boolean).sort();
  if (versions.length === 0) fail("Không đọc được remote migration version.");
  return versions.at(-1);
}

async function createProductionBackup() {
  const createdAt = new Date().toISOString();
  const stamp = createdAt.replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const backupId = `qlv-prod-${stamp}`;
  const partial = join(backupRoot, `.${backupId}.partial`);
  const destination = join(backupRoot, backupId);
  await mkdir(partial, { recursive: false, mode: 0o700 });
  try {
    const key = safeRun("security", ["find-generic-password", "-s", keychainService, "-w"]);
    const definitions = [
      ["app-schema-public-private.sql.qlvbak", ["--schema", "public,private"], "schema"],
      ["app-data-public-private.sql.qlvbak", ["--schema", "public,private", "--data-only", "--use-copy"], "data"],
      ["auth-schema.sql.qlvbak", ["--schema", "auth"], "schema"],
      ["auth-data.sql.qlvbak", ["--schema", "auth", "--data-only", "--use-copy"], "data"],
      ["migrations-schema.sql.qlvbak", ["--schema", "supabase_migrations"], "schema"],
      ["migrations-data.sql.qlvbak", ["--schema", "supabase_migrations", "--data-only", "--use-copy"], "data"],
    ];
    for (const [name, args, kind] of definitions) {
      const output = join(partial, name);
      await encryptedDump(args, output, key);
      await verifyCiphertext(output, kind, key);
    }
    const manifestPath = join(partial, "backup.manifest.json");
    const manifest = await createBackupManifest({
      manifestPath,
      backupId,
      createdAt,
      projectRef,
      migrationVersion: latestMigration(),
      filePaths: definitions.map(([name]) => join(partial, name)),
    });
    await (await import("node:fs/promises")).writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600, flag: "wx" });
    await verifyBackupManifest({ manifest, manifestPath, expectedProjectRef: projectRef, maxAgeHours: 1 });
    await rename(partial, destination);
    const entries = await readBackupManifests(backupRoot);
    const retention = planRetention(entries.map((entry) => entry.manifest), { daily: 7, weekly: 4, monthly: 12 });
    process.stdout.write(`${JSON.stringify({ ok: true, backupId, migrationVersion: manifest.migrationVersion, files: manifest.files.length, retentionDryRun: retention }, null, 2)}\n`);
  } catch (error) {
    await rm(partial, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  await mkdir(backupRoot, { recursive: true, mode: 0o700 });
  if (!["ensure", "run", "check"].includes(command)) fail("Cách dùng: production-backup.mjs <ensure|run|check>");
  const entries = await readBackupManifests(backupRoot);
  const latest = newestBackup(entries);
  if (command === "check") {
    if (!latest) fail("Chưa có backup Production.");
    const result = await verifyBackupManifest({ manifest: latest.manifest, manifestPath: latest.path, expectedProjectRef: projectRef, maxAgeHours: 24 });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return;
  }
  if (command === "ensure" && latest && backupAgeHours(latest.manifest) < thresholdHours) {
    const result = await verifyBackupManifest({ manifest: latest.manifest, manifestPath: latest.path, expectedProjectRef: projectRef, maxAgeHours: thresholdHours });
    process.stdout.write(`${JSON.stringify({ ok: true, action: "not-due", backupId: result.backupId, ageHours: result.ageHours, thresholdHours }, null, 2)}\n`);
    return;
  }
  await createProductionBackup();
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});

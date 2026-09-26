#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createBackupManifest, planRetention, verifyBackupManifest } from "./lib/backup-health.mjs";
import { readBackupManifests } from "./lib/backup-schedule.mjs";

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function valueAfter(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) fail(`${name} cần một giá trị.`);
  return value;
}

function valuesAfter(args, name) {
  return args.flatMap((value, index) => value === name && args[index + 1] && !args[index + 1].startsWith("--") ? [args[index + 1]] : []);
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function verify(args) {
  const manifestArg = valueAfter(args, "--manifest");
  const projectRef = valueAfter(args, "--project-ref");
  const maxAgeRaw = valueAfter(args, "--max-age-hours") ?? "24";
  if (!manifestArg || !projectRef) fail("verify cần --manifest và --project-ref.");
  const maxAgeHours = Number(maxAgeRaw);
  const manifestPath = resolve(manifestArg);
  const result = await verifyBackupManifest({
    manifest: await readJson(manifestPath),
    manifestPath,
    expectedProjectRef: projectRef,
    maxAgeHours,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

function parseRowCounts(values) {
  if (values.length === 0) return undefined;
  const result = {};
  for (const value of values) {
    const separator = value.indexOf("=");
    if (separator <= 0) fail(`Row count không hợp lệ: ${value}`);
    const table = value.slice(0, separator);
    const count = Number(value.slice(separator + 1));
    if (Object.hasOwn(result, table)) fail(`Row count bị khai báo trùng: ${table}`);
    result[table] = count;
  }
  return result;
}

async function create(args) {
  const outputArg = valueAfter(args, "--output");
  const backupId = valueAfter(args, "--backup-id");
  const createdAt = valueAfter(args, "--created-at");
  const projectRef = valueAfter(args, "--project-ref");
  const migrationVersion = valueAfter(args, "--migration-version");
  const filePaths = valuesAfter(args, "--file").map((filePath) => resolve(filePath));
  if (!outputArg || !backupId || !createdAt || !projectRef || !migrationVersion || filePaths.length === 0) {
    fail("create cần --output, --backup-id, --created-at, --project-ref, --migration-version và ít nhất một --file.");
  }
  const output = resolve(outputArg);
  const manifest = await createBackupManifest({
    manifestPath: output,
    backupId,
    createdAt,
    projectRef,
    migrationVersion,
    filePaths,
    rowCounts: parseRowCounts(valuesAfter(args, "--row-count")),
  });
  await writeFile(output, `${JSON.stringify(manifest, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
  process.stdout.write(`${JSON.stringify({ ok: true, manifest: output, files: manifest.files.length }, null, 2)}\n`);
}

async function retention(args) {
  const directoryArg = valueAfter(args, "--directory");
  if (!directoryArg) fail("retention cần --directory.");
  const directory = resolve(directoryArg);
  const entries = await readBackupManifests(directory);
  if (entries.length === 0) fail("Không tìm thấy backup.manifest.json.");
  const manifests = entries.map((entry) => entry.manifest);
  const result = planRetention(manifests, {
    daily: Number(valueAfter(args, "--daily") ?? 7),
    weekly: Number(valueAfter(args, "--weekly") ?? 4),
    monthly: Number(valueAfter(args, "--monthly") ?? 12),
  });
  process.stdout.write(`${JSON.stringify({ dryRun: true, ...result }, null, 2)}\n`);
}

const [command, ...args] = process.argv.slice(2);
try {
  if (command === "create") await create(args);
  else if (command === "verify") await verify(args);
  else if (command === "retention") await retention(args);
  else fail("Cách dùng: backup-health.mjs <create|verify|retention> [options]");
} catch (error) {
  fail(error instanceof Error ? error.message : "Kiểm tra backup thất bại.");
}

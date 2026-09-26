import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { validateManifestShape } from "./backup-health.mjs";

export async function discoverBackupManifests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".manifest.json")) paths.push(join(directory, entry.name));
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const children = await readdir(join(directory, entry.name), { withFileTypes: true });
    for (const child of children) {
      if (child.isFile() && child.name === "backup.manifest.json") paths.push(join(directory, entry.name, child.name));
    }
  }
  return paths.sort();
}

export async function readBackupManifests(directory) {
  return Promise.all((await discoverBackupManifests(directory)).map(async (path) => ({
    path,
    manifest: validateManifestShape(JSON.parse(await readFile(path, "utf8"))),
  })));
}

export function newestBackup(entries) {
  return entries.toSorted((a, b) => Date.parse(b.manifest.createdAt) - Date.parse(a.manifest.createdAt))[0];
}

export function backupAgeHours(manifest, now = new Date()) {
  return (now.getTime() - Date.parse(manifest.createdAt)) / 3_600_000;
}

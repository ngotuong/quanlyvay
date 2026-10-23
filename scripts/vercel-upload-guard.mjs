import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Explicitly supported ignore contract. Unknown/negated rules require review rather than
// silently weakening this metadata-only preflight. Vercel still owns the actual payload.
const rules = [
  "/apps/google-sync/", "/packages/", "/supabase/", "/docs/", "/scripts/",
  "/apps/web/test/", "/apps/web/playwright.config.ts",
  "/AGENTS.md", "/PROJECT_CONTEXT.md", "/README.md", "**/.clasp.json", "**/*.tsbuildinfo",
  "/.git", "/.backups/", "/.cache/", "**/.backups/", "**/.cache/", "**/.tmp/", "**/test-results/", "**/playwright-report/", "**/coverage/",
  "**/*.log", "**/.env", "**/.env.*", "!**/.env.example", "**/*.pem", "**/*.key",
  "/.tmp/", "/.c55-remote-head/", "/.gitleaksignore",
];
const automaticDirectories = new Set([".git", "node_modules", ".next", ".vercel"]);

export function validateUploadIgnore(text) {
  const actual = text.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith("#"));
  if (actual.length !== rules.length || actual.some((rule, i) => rule !== rules[i])) {
    throw new Error("Vercel upload exclusions drifted; review the metadata guard before deployment.");
  }
  return actual;
}

function excluded(path, directory) {
  let ignored = false;
  for (const rule of rules) {
    if (rule === "!**/.env.example") {
      if (path.split("/").at(-1) === ".env.example") ignored = false;
    } else if (rule.startsWith("/") && rule.endsWith("/")) {
      const prefix = rule.slice(1, -1);
      if (path === prefix || path.startsWith(`${prefix}/`)) ignored = true;
    } else if (rule.startsWith("/")) {
      if (path === rule.slice(1)) ignored = true;
    } else {
      const pattern = rule.slice(3);
      if (pattern.endsWith("/")) {
        if (path.split("/").includes(pattern.slice(0, -1))) ignored = true;
      } else {
        const name = path.split("/").at(-1);
        if (pattern.startsWith("*")) { if (name.endsWith(pattern.slice(1))) ignored = true; }
        else if (pattern === ".env.*") { if (name.startsWith(".env.")) ignored = true; }
        else if (name === pattern) ignored = true;
      }
    }
  }
  return ignored || (directory && automaticDirectories.has(path.split("/").at(-1)));
}

export function assertUploadMetadata(entries) {
  for (const entry of entries) {
    const path = entry.path.replaceAll("\\", "/");
    const parts = path.split("/");
    const name = parts.at(-1);
    if (!path || path.startsWith("/") || parts.some(p => !p || p === "." || p === "..") || entry.type !== "file" ||
      path.startsWith("apps/web/test/") || path === "apps/web/playwright.config.ts" || path === ".gitleaksignore" ||
      parts.some(p => [".backups", ".cache", ".tmp", "test-results", "playwright-report", "coverage", "node_modules", ".git", ".next", ".vercel"].includes(p)) ||
      name === ".clasp.json" || (name.startsWith(".env") && name !== ".env.example") ||
      /\.(?:qlvbak|sql|dump|backup|sqlite|sqlite3|log|pem|key|p12|pfx|tsbuildinfo)$/i.test(name) ||
      /^(?:credentials|secrets?)(?:\.|$)/i.test(name)) {
      throw new Error(`Forbidden deployment metadata: ${path}`);
    }
  }
  return { files: entries.length, bytes: entries.reduce((sum, entry) => sum + entry.size, 0) };
}

export function inspectUploadMetadata(root) {
  validateUploadIgnore(readFileSync(join(root, ".vercelignore"), "utf8"));
  const entries = [];
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const path = relative(root, absolute).replaceAll("\\", "/");
      if (excluded(path, entry.isDirectory())) continue;
      if (entry.isDirectory()) walk(absolute);
      else {
        const stat = lstatSync(absolute);
        entries.push({ path, type: entry.isSymbolicLink() ? "symlink" : entry.isFile() ? "file" : "other", size: stat.size });
      }
    }
  }
  walk(root);
  return assertUploadMetadata(entries);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify({ scope: "local metadata prediction; actual remote inventory remains required", ...inspectUploadMetadata(resolve(process.argv[2] || ".")) }));
}

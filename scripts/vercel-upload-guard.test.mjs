import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import test from "node:test";
import { assertUploadMetadata, inspectUploadMetadata, validateUploadIgnore } from "./vercel-upload-guard.mjs";
const ignore = readFileSync(new URL("../.vercelignore", import.meta.url), "utf8");
const file = path => ({ path, type: "file", size: 3 });

test("metadata guard rejects secret/dump/artifact paths without reading contents", () => {
  for (const path of [".backups/a.qlvbak", "public/copy.sql", "public/a.dump", "public/secrets.json", "apps/web/.env.local", ".clasp.json", "public/key.pem", "apps/web/test-results/a.png", "apps/web/test/e2e/helpers.ts", "apps/web/playwright.config.ts", "a\\.cache\\x", "../outside"]) {
    assert.throws(() => assertUploadMetadata([file(path)]), /Forbidden/);
  }
  assert.deepEqual(assertUploadMetadata([file("apps/web/src/app/page.tsx"), file("apps/web/.env.example"), file("pnpm-lock.yaml")]), { files: 3, bytes: 9 });
});
test("ignore drift, missing exclusions and later negation fail closed", () => {
  assert.doesNotThrow(() => validateUploadIgnore(ignore));
  assert.throws(() => validateUploadIgnore(ignore.replace("/.backups/", "")), /drifted/);
  assert.throws(() => validateUploadIgnore(`${ignore}\n!/.backups/\n`), /drifted/);
  assert.throws(() => assertUploadMetadata([file(".gitleaksignore")]), /Forbidden/);
});
test("local inventory skips excluded directories and detects stray dump and symlink", () => {
  mkdirSync(resolve(".cache"), { recursive: true });
  const root = mkdtempSync(resolve(".cache/c78-upload-fixture-"));
  try {
    writeFileSync(join(root, ".vercelignore"), ignore);
    writeFileSync(join(root, ".git"), "gitdir: /synthetic-managed-worktree");
    mkdirSync(join(root, ".backups")); writeFileSync(join(root, ".backups/a.qlvbak"), "FAKE EXCLUDED FIXTURE");
    for (const path of ["apps/web/.cache", "apps/web/.backups", "apps/web/.tmp", "scripts"]) {
      mkdirSync(join(root, path), { recursive: true });
      writeFileSync(join(root, path, "excluded.sql"), "FAKE EXCLUDED FIXTURE");
    }
    // The deployment omits scripts. Shipping E2E/config would leave TypeScript imports
    // to scripts/test-environment.cjs dangling even though the full local tree builds.
    mkdirSync(join(root, "apps/web/test/e2e"), { recursive: true });
    writeFileSync(join(root, "apps/web/test/e2e/helpers.ts"), 'export {} from "../../../../scripts/test-environment.cjs";');
    writeFileSync(join(root, "apps/web/playwright.config.ts"), 'import "./test/e2e/helpers";');
    mkdirSync(join(root, "node_modules")); writeFileSync(join(root, "node_modules/a"), "synthetic");
    mkdirSync(join(root, "public")); writeFileSync(join(root, "public/ok.svg"), "synthetic");
    assert.equal(inspectUploadMetadata(root).files, 2);
    writeFileSync(join(root, "public/stray.sql"), "FAKE NOT A DUMP");
    assert.throws(() => inspectUploadMetadata(root), /Forbidden/);
    rmSync(join(root, "public/stray.sql"));
    symlinkSync("ok.svg", join(root, "public/link.svg"));
    assert.throws(() => inspectUploadMetadata(root), /Forbidden/);
  } finally { rmSync(root, { recursive: true }); }
});

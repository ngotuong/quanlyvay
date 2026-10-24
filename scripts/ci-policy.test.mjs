import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

function validate(path) {
  return spawnSync(process.execPath, ["scripts/ci-policy.mjs", path], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

test("CI policy accepts the production workflow", () => {
  const result = validate(".github/workflows/ci.yml");
  assert.equal(result.status, 0, result.stderr);
});

test("CI policy blocks an intentionally unsafe fixture", () => {
  const result = validate("scripts/fixtures/ci-unsafe.yml");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /continue-on-error: true/);
  assert.match(result.stderr, /credential Production/);
});

test("CI policy blocks removal of the bounded two-shard E2E matrix", () => {
  const directory = mkdtempSync(join(tmpdir(), "qlv-ci-policy-"));
  const fixture = join(directory, "ci-unsharded.yml");
  try {
    writeFileSync(fixture, readFileSync(".github/workflows/ci.yml", "utf8").replace("shard: [1, 2]", "shard: [1]"));
    const validation = validate(fixture);
    assert.notEqual(validation.status, 0);
    assert.match(validation.stderr, /hai shard/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

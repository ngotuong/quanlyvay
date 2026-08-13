import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
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

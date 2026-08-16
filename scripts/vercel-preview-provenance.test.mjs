import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  assertDeploymentProvenance,
  assertPromotionProvenance,
  parseProjectInspection,
} from "./vercel-preview-provenance.mjs";

function fixture(name) {
  return JSON.parse(readFileSync(new URL(`./fixtures/vercel-preview/${name}.json`, import.meta.url), "utf8"));
}

test("accepts a correct immutable candidate and same-project rollback target", () => {
  const result = assertPromotionProvenance({ candidate: fixture("correct"), rollback: fixture("rollback") });
  assert.equal(result.candidate.deploymentId, "dpl_Candidate123");
  assert.equal(result.rollback.deploymentId, "dpl_Rollback123");
});

test("blocks a stable alias before alias set", () => {
  let aliasSetCalled = false;
  assert.throws(() => {
    assertPromotionProvenance({ candidate: fixture("stable-alias"), rollback: fixture("rollback") });
    aliasSetCalled = true;
  }, /immutable deployment URL/);
  assert.equal(aliasSetCalled, false);
});

test("blocks a wrong project before alias set", () => {
  let aliasSetCalled = false;
  assert.throws(() => {
    assertPromotionProvenance({ candidate: fixture("wrong-project"), rollback: fixture("rollback") });
    aliasSetCalled = true;
  }, /org otherteam/);
  assert.equal(aliasSetCalled, false);
});

test("blocks a rollback target from another project or org", () => {
  const rollback = fixture("rollback");
  rollback.project.orgSlug = "another-team";
  assert.throws(
    () => assertPromotionProvenance({ candidate: fixture("correct"), rollback }),
    /org another-team/,
  );
});

test("blocks a candidate URL whose inspect result resolves to another immutable URL", () => {
  const candidate = fixture("correct");
  candidate.requestedUrl = "https://some-alias.vercel.app";
  assert.throws(() => assertDeploymentProvenance(candidate), /immutable deployment URL/);
});

test("blocks a candidate that is not Preview, READY and entirely in sin1", () => {
  const wrongTarget = fixture("correct");
  wrongTarget.deployment.target = "production";
  assert.throws(() => assertDeploymentProvenance(wrongTarget), /target=preview và READY/);

  const notReady = fixture("correct");
  notReady.deployment.readyState = "BUILDING";
  assert.throws(() => assertDeploymentProvenance(notReady), /target=preview và READY/);

  const wrongRegion = fixture("correct");
  wrongRegion.deployment.builds[0].output[0].lambda.deployedTo = ["iad1"];
  assert.throws(() => assertDeploymentProvenance(wrongRegion), /Functions đều ở sin1/);
});

test("parses fail-closed project and org evidence from Vercel CLI output", () => {
  const parsed = parseProjectInspection(`
> Found Project ngotuong2105/quan-ly-vay-ca-nhan [284ms]
ID\t\t\t\tprj_F9OEZuPZx9mXyUfHi3cU1cYDxq7F
Name\t\t\tquan-ly-vay-ca-nhan
Root Directory\t\tapps/web
`);
  assert.deepEqual(parsed, fixture("correct").project);
  assert.throws(() => parseProjectInspection("schema changed"), /schema CLI có thể đã đổi/);
});

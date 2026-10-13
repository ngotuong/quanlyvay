import assert from "node:assert/strict";
import { test } from "node:test";
import { readWithTiming } from "../../src/lib/app/read-timing.mjs";

test("read timing excludes private results and unsafe labels while returning the exact result once", async t => {
  const lines = [];
  t.mock.method(console, "info", (...args) => lines.push(args));
  const result = { data: { privateValue: "hidden-value", amount: "50000000" }, error: null };
  let calls = 0;
  assert.equal(await readWithTiming("private-label", async () => { calls++; return result; }), result);
  assert.equal(calls, 1);
  assert.equal(lines.length, 1);
  const recorded = JSON.parse(lines[0][1]);
  assert.deepEqual(Object.keys(recorded).sort(), ["durationMs", "operation", "outcome"]);
  assert.equal(recorded.operation, "other");
  assert.equal(recorded.outcome, "ok");
  assert.ok(Number.isFinite(recorded.durationMs) && recorded.durationMs >= 0);
  assert.ok(!JSON.stringify(lines).includes("hidden-value"));
  assert.ok(!JSON.stringify(lines).includes("50000000"));
});

test("read timing preserves the original failure without retrying or logging its private message", async t => {
  const lines = [];
  t.mock.method(console, "info", (...args) => lines.push(args));
  const failure = new Error("private-detail");
  let calls = 0;
  await assert.rejects(readWithTiming("auth.user", async () => { calls++; throw failure; }), error => error === failure);
  assert.equal(calls, 1);
  assert.equal(JSON.parse(lines[0][1]).outcome, "error");
  assert.ok(!JSON.stringify(lines).includes("private-detail"));
});

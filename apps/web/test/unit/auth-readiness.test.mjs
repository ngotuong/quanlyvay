import assert from "node:assert/strict";
import test from "node:test";
import { waitForAuthReady } from "../e2e/auth-readiness.mjs";

test("Auth readiness retries transient 502 responses with bounded backoff", async () => {
  let currentTime = 0;
  let calls = 0;
  const result = await waitForAuthReady({
    healthUrl: "http://127.0.0.1:55321/auth/v1/health",
    headers: {},
    timeoutMs: 10_000,
    fetchImpl: async () => ({ ok: ++calls === 4, status: 502 }),
    sleep: async (delay) => { currentTime += delay; },
    now: () => currentTime,
  });
  assert.equal(result.attempt, 4);
  assert.deepEqual([calls, currentTime], [4, 1_750]);
});

test("Auth readiness reports the last failure at its deadline", async () => {
  let currentTime = 0;
  await assert.rejects(waitForAuthReady({
    healthUrl: "http://127.0.0.1:55321/auth/v1/health",
    headers: {},
    timeoutMs: 1_000,
    fetchImpl: async () => ({ ok: false, status: 502 }),
    sleep: async (delay) => { currentTime += delay; },
    now: () => currentTime,
  }), /HTTP 502/);
});

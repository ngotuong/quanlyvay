import assert from "node:assert/strict";
import test from "node:test";
import { drainPushQueue } from "../../src/lib/notifications/worker.mjs";

test("Push bounds concurrent sends, supplies timeout and drains multiple batches", async () => {
  const queue = Array.from({ length: 12 }, (_, id) => ({ id }));
  let active = 0, peak = 0;
  const result = await drainPushQueue({
    claim: async size => queue.splice(0, size),
    send: async (_row, options) => { assert.equal(options.timeout, 5000); peak = Math.max(peak, ++active); await new Promise(resolve => setImmediate(resolve)); active--; },
    complete: async () => true, remove: async () => {},
  });
  assert.equal(peak, 5); assert.equal(result.sent, 12); assert.equal(result.queueRemaining, false);
});
test("slow endpoints stop new claims at budget and retain queue signal", async () => {
  let time = 0, claims = 0;
  const result = await drainPushQueue({ now: () => time, budgetMs: 4000,
    claim: async () => { claims++; return Array.from({length: 5}, (_, id) => ({id})); },
    send: async () => { time = 5000; throw new Error("timeout endpoint secret"); },
    complete: async (_row, ok, message) => { assert.equal(ok, false); assert.doesNotMatch(message, /secret/); return true; }, remove: async () => {},
  });
  assert.equal(claims, 1); assert.equal(result.failed, 5); assert.equal(result.queueRemaining, true);
});
test("exhausted generation budget never reports an empty queue", async () => {
  const result = await drainPushQueue({ now: () => 50000, startedAt: 0, claim: async () => { throw new Error("must not claim"); }, send() {}, complete() {}, remove() {} });
  assert.equal(result.queueRemaining, true); assert.equal(result.claimed, 0);
});
test("completion retries are bounded; stale subscriptions are removed and failure remains visible", async () => {
  let attempts = 0, removed = 0;
  const result = await drainPushQueue({ claim: async () => [{id: 1}],
    send: async () => { throw Object.assign(new Error("gone"), {statusCode: 410}); },
    complete: async () => { attempts++; return false; }, remove: async () => { removed++; },
  });
  assert.equal(attempts, 3); assert.equal(removed, 1); assert.equal(result.stateUpdateFailed, 1); assert.equal(result.sent, 0);
});
test("claim errors propagate instead of a false success", async () => {
  await assert.rejects(drainPushQueue({ claim: async () => { throw new Error("DB unavailable"); }, send() {}, complete() {}, remove() {} }), /DB unavailable/);
});

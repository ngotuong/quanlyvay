import assert from "node:assert/strict";
import test from "node:test";
import { readRpcWithGatewayRetry } from "../../src/lib/business/read-rpc-retry.mjs";
const operation = "calculate_loan";

test("one failed gateway read can recover and returns only the authoritative result", async () => {
  for (const status of [502, 503, 504]) {
    let calls = 0;
    const expected = { data: { principal: "9007199254740993" }, error: null, status: 200 };
    const actual = await readRpcWithGatewayRetry(operation, async () => ++calls === 1 ? { data: null, error: { message: "gateway unavailable" }, status } : expected, async ms => assert.equal(ms, 100));
    assert.equal(actual, expected); assert.equal(calls, 2);
  }
});
test("a persistent gateway failure stops after two attempts without fabricating data", async () => {
  let calls = 0; const failure = { error: { message: "gateway unavailable" }, data: null, status: 502 };
  assert.equal(await readRpcWithGatewayRetry(operation, async () => { calls++; return failure; }, async () => {}), failure);
  assert.equal(calls, 2);
});
test("success, Auth, SQL, missing RPC and aborted reads are never retried", async () => {
  for (const result of [
    { error: null, data: { principal: "1" }, status: 200 },
    { error: { message: "unauthorized" }, status: 401 },
    { error: { code: "42501" }, status: 403 },
    { error: { code: "P0001" }, status: 502 },
    { error: { code: "PGRST202" }, status: 404 },
    { error: { message: "AbortError" }, status: 0 },
    { error: { message: "AbortError" }, status: 502 },
  ]) {
    let calls = 0;
    assert.equal(await readRpcWithGatewayRetry(operation, async () => { calls++; return result; }, async () => assert.fail("must not pause")), result);
    assert.equal(calls, 1);
  }
});
test("financial writes and arbitrary RPC names are rejected before any call", async () => {
  for (const name of ["create_loan_v3", "record_loan_transaction", "settle_loan", "reverse_loan_settlement", "set_notification_read", "calculate_loan?token=secret"]) {
    await assert.rejects(readRpcWithGatewayRetry(name, async () => assert.fail("mutation must not run")), /not approved/);
  }
});

import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { readFailureDiagnostic } from "../../src/lib/business/read-failure-diagnostics.mjs";

test("transport diagnostics never include credentials, URLs, SQL or financial payloads", () => {
  const sensitive = "Bearer secret-token; cookie=secret; SELECT private_name; 123456789 VND";
  const result = readFailureDiagnostic({ status: 0, error: { code: sensitive, message: `TypeError: fetch failed ${sensitive}`, details: sensitive }, data: { secret: sensitive } });
  assert.deepEqual(result, { kind: "transport", code: null, status: 0 });
  assert.equal(JSON.stringify(result).includes(sensitive), false);
});
test("database and PostgREST errors retain only bounded diagnostic codes and HTTP status", () => {
  assert.deepEqual(readFailureDiagnostic({ error: { code: "42501", message: "private SQL detail" }, status: 403 }), { kind: "database", code: "42501", status: 403 });
  assert.deepEqual(readFailureDiagnostic({ error: { code: "PGRST202" }, status: 404 }), { kind: "database", code: "PGRST202", status: 404 });
});
test("aborted reads remain distinguishable from empty successful responses", () => {
  assert.deepEqual(readFailureDiagnostic({ error: { message: "AbortError: request aborted" }, status: 0 }), { kind: "aborted", code: null, status: 0 });
  assert.deepEqual(readFailureDiagnostic({ error: null, data: null, status: 200 }), { kind: "empty", code: null, status: 200 });
});
test("SQL errors stay database errors when their private message contains transport keywords", () => {
  assert.deepEqual(readFailureDiagnostic({ error: { code: "P0001", message: "network aborted private business text" }, status: 400 }), { kind: "database", code: "P0001", status: 400 });
});
test("unknown malformed errors and statuses cannot enter logs as arbitrary values", () => {
  assert.deepEqual(readFailureDiagnostic({ error: "sensitive string", status: 700 }), { kind: "unknown", code: null, status: null });
  assert.deepEqual(readFailureDiagnostic({ error: { code: "token-value", message: "private data" } }), { kind: "unknown", code: null, status: null });
  assert.deepEqual(readFailureDiagnostic({ error: { code: "LINHH", message: "private name" } }), { kind: "unknown", code: null, status: null });
});
test("Supabase SDK transport failures classify safely without making a network request", async () => {
  let calls = 0;
  const supabase = createClient("http://127.0.0.1:55321", "synthetic-unit-key", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: async () => { calls++; throw new TypeError("fetch failed: private financial payload and token"); } },
  });
  const result = await supabase.rpc("get_management_dashboard_bundle_v3", {});
  assert.equal(calls, 1);
  assert.deepEqual(readFailureDiagnostic(result), { kind: "transport", code: null, status: 0 });
});

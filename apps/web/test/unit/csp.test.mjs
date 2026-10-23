import assert from "node:assert/strict";
import test from "node:test";
import { contentSecurityPolicy, createCspNonce } from "../../src/lib/security/csp.mjs";

test("production CSP uses a per-request script nonce without unsafe-inline", () => {
  const first = createCspNonce();
  const second = createCspNonce();
  assert.notEqual(first, second);
  const policy = contentSecurityPolicy({
    nonce: first,
    supabaseUrl: "https://project.supabase.co/path",
  });
  const scriptDirective = policy.split("; ").find(item => item.startsWith("script-src "));
  assert.equal(scriptDirective, `script-src 'self' 'nonce-${first}' 'strict-dynamic'`);
  assert.doesNotMatch(scriptDirective, /'unsafe-inline'/);
  assert.doesNotMatch(scriptDirective, /'unsafe-eval'/);
  assert.match(policy, /connect-src 'self' https:\/\/project\.supabase\.co/);
});

test("development CSP permits eval for Next tooling but still forbids inline scripts", () => {
  const policy = contentSecurityPolicy({ nonce: createCspNonce(), development: true });
  const scriptDirective = policy.split("; ").find(item => item.startsWith("script-src "));
  assert.match(scriptDirective, /'unsafe-eval'/);
  assert.doesNotMatch(scriptDirective, /'unsafe-inline'/);
});

test("CSP rejects caller-controlled malformed nonces", () => {
  assert.throws(() => contentSecurityPolicy({ nonce: "'; script-src *" }), /Invalid CSP nonce/);
});

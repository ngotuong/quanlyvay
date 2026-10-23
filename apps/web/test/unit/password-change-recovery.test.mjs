import assert from "node:assert/strict";
import test from "node:test";
import {
  canReconcilePasswordChange,
  passwordChangeCompletionGeneration,
  passwordChangeCompletionMetadata,
} from "../../src/lib/auth/password-change.mjs";

test("password completion metadata records only a server generation marker", () => {
  const metadata = passwordChangeCompletionMetadata({ role: "authenticated" }, 7);
  assert.deepEqual(metadata, { role: "authenticated", password_change_generation: 7 });
  assert.equal(passwordChangeCompletionGeneration(metadata), 7);
  assert.equal("password" in metadata, false);
});

test("password recovery requires the same user and exact current generation", () => {
  const profile = { user_id: "user-a", must_change_password: true, password_reset_generation: 7 };
  assert.equal(canReconcilePasswordChange("user-a", { password_change_generation: 7 }, profile), true);
  assert.equal(canReconcilePasswordChange("user-b", { password_change_generation: 7 }, profile), false);
  assert.equal(canReconcilePasswordChange("user-a", { password_change_generation: 6 }, profile), false);
  assert.equal(canReconcilePasswordChange("user-a", { password_change_generation: 8 }, profile), false);
  assert.equal(canReconcilePasswordChange("user-a", { password_change_generation: "7" }, profile), false);
  assert.equal(canReconcilePasswordChange("user-a", { password_change_generation: 7 }, { ...profile, must_change_password: false }), false);
});

test("password completion generation rejects malformed or unsafe values", () => {
  for (const value of [undefined, null, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "0"]) {
    assert.equal(passwordChangeCompletionGeneration({ password_change_generation: value }), null);
  }
  assert.throws(() => passwordChangeCompletionMetadata({}, -1), /Invalid password reset generation/);
});

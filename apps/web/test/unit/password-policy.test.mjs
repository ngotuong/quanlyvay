import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidPassword,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "../../src/lib/auth/password-policy.mjs";

test("password policy accepts at least six letters or digits without composition requirements", () => {
  assert.equal(PASSWORD_MIN_LENGTH, 6);
  assert.equal(PASSWORD_PATTERN, "[A-Za-z0-9]+");
  assert.equal(isValidPassword("abcdef"), true);
  assert.equal(isValidPassword("123456"), true);
  assert.equal(isValidPassword("abc123"), true);
  assert.equal(isValidPassword("ABCDEF"), true);
});

test("password policy rejects short values and non-alphanumeric characters", () => {
  assert.equal(isValidPassword("abc12"), false);
  assert.equal(isValidPassword("abc 123"), false);
  assert.equal(isValidPassword("abc-123"), false);
  assert.equal(isValidPassword("mậtkhẩu"), false);
  assert.equal(isValidPassword(undefined), false);
});

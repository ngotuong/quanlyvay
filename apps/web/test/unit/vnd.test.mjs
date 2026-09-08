import assert from "node:assert/strict";
import test from "node:test";
import { normalizeVnd, formatVndDigits } from "../../src/lib/business/vnd.mjs";
test("VND normalization retains exact integers above 2^53", () => {
  assert.equal(normalizeVnd("9.007.199.254.740.993"), "9007199254740993");
  assert.equal(formatVndDigits("9223372036854775807"), "9.223.372.036.854.775.807");
  assert.equal(normalizeVnd(" 000123 "), "123");
});
test("ambiguous or signed VND strings cannot become positive digits", () => {
  for (const value of ["-1000", "+1000", "1,000", "1.5", "1e6", "12.34.567", "1 000", "1000đ"])
    assert.ok(!/^\d+$/.test(normalizeVnd(value)), value);
});

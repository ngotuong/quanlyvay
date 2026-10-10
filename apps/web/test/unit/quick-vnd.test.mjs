import assert from "node:assert/strict";
import test from "node:test";
import { addQuickVnd, MAX_QUICK_VND, PRINCIPAL_QUICK_AMOUNTS } from "../../src/lib/business/quick-vnd.mjs";

test("selected amounts map empty/zero to exact integer strings, preserving Vietnamese formatting", () => {
  assert.deepEqual(PRINCIPAL_QUICK_AMOUNTS.map(x => x.label), ["+50tr", "+100tr", "+150tr", "+200tr"]);
  for (const { amount } of PRINCIPAL_QUICK_AMOUNTS) {
    assert.equal(addQuickVnd("", amount).normalizedValue, amount);
    assert.equal(addQuickVnd("0", amount).normalizedValue, amount);
  }
  assert.deepEqual(addQuickVnd("10.000.000", "50000000"), { ok: true, normalizedValue: "60000000", formattedValue: "60.000.000" });
});
test("17-digit amounts beyond Number precision remain exact", () => {
  assert.deepEqual(addQuickVnd("9.007.199.254.740.993", "50000000"), { ok: true, normalizedValue: "9007199304740993", formattedValue: "9.007.199.304.740.993" });
  assert.deepEqual(addQuickVnd("10.000.000.000.000.001", "50000000"), { ok: true, normalizedValue: "10000000050000001", formattedValue: "10.000.000.050.000.001" });
});
test("system maximum and context maximum are inclusive and overflow never clamps", () => {
  assert.equal(addQuickVnd("9223372036804775807", "50000000").normalizedValue, MAX_QUICK_VND);
  assert.equal(addQuickVnd(MAX_QUICK_VND, "50000000").ok, false);
  assert.equal(addQuickVnd("50000000", "50000000", "100000000").normalizedValue, "100000000");
  assert.equal(addQuickVnd("100000001", "50000000", "150000000").ok, false);
  assert.equal(addQuickVnd("", "50000000", "0").ok, false);
  assert.equal(addQuickVnd("999999999999999999999999999999", "50000000").ok, false);
});
test("signs, fractions, exponents, invalid draft and invalid limit are rejected without reinterpretation", () => {
  for (const value of ["-1", "+1", "1.2", "1,5", "1e8", "abc", "50000000 ₫"]) assert.equal(addQuickVnd(value, "50000000").ok, false, value);
  assert.equal(addQuickVnd("1", "0").ok, false);
  assert.equal(addQuickVnd("1", "-50").ok, false);
  assert.equal(addQuickVnd("1", "50000000", "unknown").ok, false);
});

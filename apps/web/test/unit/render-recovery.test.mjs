import test from "node:test";
import assert from "node:assert/strict";
import { captureRender, recoverUncommittedRender } from "../../src/lib/business/render-recovery.mjs";

function fixture() {
  let revision = "before", reloads = 0, callback;
  const document = { querySelector: () => ({ getAttribute: () => revision }) };
  const location = { href: "http://localhost/loans/fake?tab=settings", reload: () => { reloads++; } };
  const env = { document, location, schedule: (fn, ms) => { assert.equal(ms, 3000); callback = fn; } };
  return { env, before: captureRender(document, location), commit: () => { revision = "after"; }, fire: () => callback?.(), reloads: () => reloads };
}
test("completed server action with an uncommitted page gets one read-only reload", () => {
  const f = fixture(); recoverUncommittedRender(f.before, f.env); f.fire(); assert.equal(f.reloads(), 1);
});
test("a committed RSC render cancels the recovery reload", () => {
  const f = fixture(); recoverUncommittedRender(f.before, f.env); f.commit(); f.fire(); assert.equal(f.reloads(), 0);
});
test("recovery never reloads a different route or a page without a marker", () => {
  const f = fixture(); recoverUncommittedRender(f.before, f.env); f.env.location.href += "&page=2"; f.fire(); assert.equal(f.reloads(), 0);
  recoverUncommittedRender({ url: f.env.location.href }, { ...f.env, schedule: () => assert.fail("must not schedule") });
});

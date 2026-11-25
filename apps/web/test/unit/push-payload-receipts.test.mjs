import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { buildPushPayload, deliveryPath } from "../../src/lib/notifications/payload.mjs";
import { parseReceiptRequest } from "../../src/lib/notifications/receipt-request.mjs";

const token = "a".repeat(64);
const origin = "https://tindung-preview.vercel.app";
const payload = (count = 3) => buildPushPayload({ title: "Nhắc thử", body: "Nội dung giả", path: "/loans/test?tab=overview", tag: "revision:1", unreadCount: count, origin, receiptToken: token });

test("declarative fallback and old SW receive identical title, badge, stable tag and same-origin destination", () => {
  const data = payload();
  assert.equal(data.web_push, 8030);
  assert.equal(data.notification.title, data.title);
  assert.equal(data.notification.body, data.body);
  assert.equal(data.notification.tag, data.tag);
  assert.equal(data.notification.app_badge, String(data.badgeCount));
  assert.equal(data.notification.navigate, origin + data.url);
  assert.equal(payload(0).notification.app_badge, "0");
  assert.equal(deliveryPath({ loan_id: "fake", notification_type: "INTEREST_DUE" }), "/loans/fake?tab=overview&transaction=interest");
  assert.equal(deliveryPath({}), "/notifications");
  assert.throws(() => buildPushPayload({ ...data, origin, path: "https://evil.example/", unreadCount: 1 }));
  for (const count of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) assert.throws(() => payload(count));
});

async function workerPush(data, { showError, badgeError, supported = true, receiptError = false, proposedNotification } = {}) {
  const events = {}, shown = [], badges = [], receipts = [];
  const navigator = supported ? { setAppBadge: value => { badges.push(value); if (badgeError) throw Error("badge"); return Promise.resolve(); } } : {};
  const context = vm.createContext({ URL, AbortController, setTimeout, clearTimeout,
    fetch: async (path, init) => { receipts.push({ path, ...init, body: JSON.parse(init.body) }); if (receiptError) throw Error("network"); return {}; },
    self: { location: { origin }, navigator, addEventListener: (name, fn) => { events[name] = fn; },
      registration: { showNotification: (title, options) => { shown.push({ title, ...options }); if (showError) throw Error("show"); return Promise.resolve(); } } },
  });
  vm.runInContext(readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8"), context);
  let lifetime;
  events.push({ data: proposedNotification ? null : { json: () => data }, notification: proposedNotification,
    waitUntil: promise => { lifetime = promise; } });
  await lifetime;
  return { shown, badges, receipts };
}

test("new and legacy payloads display exactly once; receipt contains no notification content or cookie", async () => {
  for (const data of [payload(), { title: "Legacy", body: "Old", url: "/notifications", tag: "old", badgeCount: 2 }]) {
    const result = await workerPush(data);
    assert.equal(result.shown.length, 1);
    assert.equal(result.shown[0].title, data.title);
    assert.equal(result.shown[0].data.url, origin + data.url);
    assert.deepEqual(result.badges, [data.badgeCount]);
    for (const receipt of result.receipts) {
      assert.equal(receipt.path, "/api/notifications/receipt");
      assert.equal(receipt.credentials, "omit");
      assert.equal(receipt.redirect, "error");
      assert.equal(receipt.cache, "no-store");
      assert.equal(receipt.body.token, token);
      assert.equal(receipt.body.title, undefined);
    }
    assert.equal(result.receipts.length, data.receiptToken ? 2 : 0);
  }
});

test("WebKit event.notification with null data defers to the OS, preserving fallback without duplicate/generic text", async () => {
  const result = await workerPush(null, { proposedNotification: { title: "System proposal", data: { receiptToken: token } } });
  assert.equal(result.shown.length, 0);
  assert.equal(result.badges.length, 0);
  assert.equal(result.receipts.find(r => r.body.stage === "COMPLETED").body.notificationResult, "DEFERRED");
  assert.equal(payload().mutable, false, "normal deliveries bypass old service workers on declarative browsers");
});

test("show/badge/receipt failures are independent and unsupported/zero badges are recorded accurately", async () => {
  for (const options of [{ showError: true }, { badgeError: true }, { receiptError: true }, { supported: false }, {}]) {
    const result = await workerPush(payload(0), options);
    assert.equal(result.shown.length, 1);
    assert.deepEqual(result.badges, options.supported === false ? [] : [0]);
    const complete = result.receipts.find(r => r.body.stage === "COMPLETED").body;
    assert.equal(complete.notificationResult, options.showError ? "FAILED" : "SUCCEEDED");
    assert.equal(complete.badgeResult, options.supported === false ? "UNSUPPORTED" : options.badgeError ? "FAILED" : "SUCCEEDED");
  }
});

test("worker rejects external deep links and does not send malformed receipt tokens", async () => {
  const result = await workerPush({ title: "Safe", url: "https://evil.example", receiptToken: "bad", badgeCount: -1 });
  assert.equal(result.shown[0].data.url, origin + "/notifications");
  assert.deepEqual(result.receipts, []);
  assert.deepEqual(result.badges, []);
  assert.equal((await workerPush(null)).shown.length, 1);
});

const request = (body, headers = { "Content-Type": "application/json" }) => new Request(origin, { method: "POST", headers, body: JSON.stringify(body) });
test("receipt request validates exact schema and caps bytes even with forged Content-Length", async () => {
  assert.deepEqual(await parseReceiptRequest(request({ token, stage: "RECEIVED" })), { token, stage: "RECEIVED" });
  const completed = { token, stage: "COMPLETED", notificationResult: "SUCCEEDED", badgeResult: "FAILED" };
  assert.deepEqual(await parseReceiptRequest(request(completed)), completed);
  for (const data of [null, [], { token: [token], stage: "RECEIVED" }, { ...completed, extra: true },
    { token, stage: "RECEIVED", badgeResult: "FAILED" }, { ...completed, notificationResult: "MAYBE" },
    { ...completed, badgeResult: "MAYBE" }, { token: "bad", stage: "RECEIVED" }]) {
    assert.equal(await parseReceiptRequest(request(data)), null);
  }
  assert.equal(await parseReceiptRequest(request(completed, { "Content-Type": "text/plain" })), null);
  assert.equal(await parseReceiptRequest(request({ token, stage: "RECEIVED", padding: "x".repeat(600) }, { "Content-Type": "application/json", "Content-Length": "1" })), null);
});

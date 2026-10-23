import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedPushHostPatterns,
  createPinnedPushAgent,
  isPublicPushAddress,
  parseAllowedPushEndpoint,
} from "../../src/lib/notifications/push-endpoint.mjs";

test("Web Push endpoint policy permits only HTTPS/443 approved providers", () => {
  for (const endpoint of [
    "https://fcm.googleapis.com/fcm/send/token",
    "https://updates.push.services.mozilla.com/wpush/v2/token",
    "https://web.push.apple.com/QP1/token",
  ]) assert.ok(parseAllowedPushEndpoint(endpoint));

  for (const endpoint of [
    "http://fcm.googleapis.com/fcm/send/token",
    "https://fcm.googleapis.com:444/fcm/send/token",
    "https://user:pass@fcm.googleapis.com/fcm/send/token",
    "https://push.example.test/token",
    "https://fcm.googleapis.com.example.test/token",
    "https://127.0.0.1/token",
    "https://[::1]/token",
  ]) assert.equal(parseAllowedPushEndpoint(endpoint), null, endpoint);
});

test("Web Push provider policy validates explicit extensions", () => {
  const patterns = allowedPushHostPatterns("push.example.test,*.push.vendor.test");
  assert.ok(parseAllowedPushEndpoint("https://push.example.test/a", patterns));
  assert.ok(parseAllowedPushEndpoint("https://region.push.vendor.test/a", patterns));
  assert.equal(parseAllowedPushEndpoint("https://push.vendor.test/a", patterns), null);
  assert.throws(() => allowedPushHostPatterns("https://push.example.test"), /provider hostname policy/);
});

test("Web Push address policy blocks private, local, multicast and reserved IPv4/IPv6", () => {
  for (const address of [
    "0.0.0.0", "10.0.0.1", "100.64.0.1", "127.0.0.1", "169.254.1.1",
    "172.16.0.1", "192.168.1.1", "192.0.2.1", "198.51.100.1", "203.0.113.1",
    "224.0.0.1", "255.255.255.255", "::", "::1", "::ffff:127.0.0.1", "64:ff9b::1",
    "fc00::1", "fe80::1", "ff02::1", "2001:db8::1", "2002::1", "3fff::1",
  ]) assert.equal(isPublicPushAddress(address), false, address);
  for (const address of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "2001:4860:4860::8888"]) {
    assert.equal(isPublicPushAddress(address), true, address);
  }
});

test("Web Push DNS policy rejects private and mixed answers", async () => {
  const endpoint = "https://fcm.googleapis.com/fcm/send/token";
  await assert.rejects(createPinnedPushAgent(endpoint, {
    lookup: async () => [{ address: "127.0.0.1", family: 4 }],
  }), /non-public/);
  await assert.rejects(createPinnedPushAgent(endpoint, {
    lookup: async () => [
      { address: "8.8.8.8", family: 4 },
      { address: "fd00::1", family: 6 },
    ],
  }), /non-public/);
});

test("Web Push DNS resolution is bounded by the delivery timeout", async () => {
  await assert.rejects(createPinnedPushAgent("https://fcm.googleapis.com/fcm/send/token", {
    lookup: () => new Promise(() => {}),
    timeoutMs: 5,
  }), error => error?.statusCode === 408 && /DNS timeout/.test(error.message));
});

test("Web Push HTTPS agent pins the public address that was validated", async () => {
  const policy = await createPinnedPushAgent("https://fcm.googleapis.com/fcm/send/token", {
    lookup: async (hostname, options) => {
      assert.equal(hostname, "fcm.googleapis.com");
      assert.deepEqual(options, { all: true, verbatim: true });
      return [
        { address: "8.8.8.8", family: 4 },
        { address: "2001:4860:4860::8888", family: 6 },
      ];
    },
  });
  try {
    assert.deepEqual({ address: policy.address, family: policy.family }, { address: "8.8.8.8", family: 4 });
    const resolved = await new Promise((resolve, reject) => policy.lookup(
      "fcm.googleapis.com",
      { all: true },
      (error, addresses) => error ? reject(error) : resolve(addresses),
    ));
    assert.deepEqual(resolved, [{ address: "8.8.8.8", family: 4 }]);
    await assert.rejects(new Promise((resolve, reject) => policy.lookup(
      "attacker.example",
      {},
      error => error ? reject(error) : resolve(),
    )), /hostname changed/);
  } finally {
    policy.agent.destroy();
  }
});

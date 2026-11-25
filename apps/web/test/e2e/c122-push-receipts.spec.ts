import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabaseEnvironment } from "./helpers";
import { buildPushPayload } from "../../src/lib/notifications/payload.mjs";

const origin = "http://127.0.0.1:3101";
const local = localSupabaseEnvironment();
const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
});

test("C122 receipt endpoint is bounded, cookie-free and does not reveal capabilities", async ({ request }) => {
  for (const data of [{ token: "bad", stage: "RECEIVED" }, { token: "a".repeat(64), stage: "RECEIVED", extra: 1 }]) {
    expect((await request.post("/api/notifications/receipt", { data })).status()).toBe(400);
  }
  const unknown = await request.post("/api/notifications/receipt", { data: { token: "a".repeat(64), stage: "RECEIVED" } });
  expect(unknown.status()).toBe(204);
  expect(unknown.headers()["cache-control"]).toContain("no-store");
  expect(unknown.headers()["set-cookie"]).toBeUndefined();
  expect(await unknown.text()).toBe("");
  expect((await request.post("/api/notifications/receipt", { headers: { origin }, data: { token: "a".repeat(64), stage: "RECEIVED" } })).status()).toBe(204);
  expect((await request.post("/api/notifications/receipt", { headers: { origin: "https://evil.example" }, data: { token: "a".repeat(64), stage: "RECEIVED" } })).status()).toBe(403);
  expect((await request.post("/api/notifications/receipt", { data: "x".repeat(600) })).status()).toBe(400);
});

test("C122 real browser Push event reaches receipt RPC without login; display failure cannot prevent badge", async ({ page, context }) => {
  await context.grantPermissions(["notifications"]);
  const created = await admin.auth.admin.createUser({ email: "c122_push@auth.local", email_confirm: true,
    user_metadata: { provisioned_by_app: "true", username: "c122_push", display_name: "C122 Push", app_role: "VIEWER" } });
  expect(created.error).toBeNull();
  const userId = created.data.user!.id;
  try {
    const sub = await admin.from("push_subscriptions").insert({ user_id: userId,
      endpoint: "https://push.example.test/c122-e2e", p256dh: "synthetic-key", auth_secret: "synthetic-auth" }).select("id").single();
    expect(sub.error).toBeNull();
    const receipt = await admin.rpc("prepare_push_receipt", { p_delivery_id: null, p_subscription_id: sub.data!.id });
    expect(receipt.error).toBeNull();
    const cdp = await context.newCDPSession(page);
    let registrationId: string | undefined;
    cdp.on("ServiceWorker.workerRegistrationUpdated", ({ registrations }) => {
      registrationId = registrations.find(r => r.scopeURL === origin + "/" && !r.isDeleted)?.registrationId ?? registrationId;
    });
    await cdp.send("ServiceWorker.enable");
    await page.goto("/login");
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await expect.poll(() => registrationId).toBeTruthy();
    await expect.poll(() => context.serviceWorkers().length).toBeGreaterThan(0);
    const worker = context.serviceWorkers().find(w => w.url() === origin + "/sw.js")!;
    // Browser integration test, not a claim that an OS banner was displayed. Keep OS untouched.
    await worker.evaluate(() => {
      const scope = globalThis as unknown as { registration: { showNotification: () => Promise<void> }; navigator: object; __badge?: number };
      scope.registration.showNotification = async () => { throw Error("synthetic display failure"); };
      Object.defineProperty(scope.navigator, "setAppBadge", { configurable: true, value: async (count: number) => { scope.__badge = count; } });
    });
    const payload = buildPushPayload({ title: "Synthetic C122", body: "Synthetic", path: "/notifications",
      origin, unreadCount: 1, tag: "c122-e2e", receiptToken: receipt.data.token, mutable: true });
    await cdp.send("ServiceWorker.deliverPushMessage", { origin, registrationId: registrationId!, data: JSON.stringify(payload) });
    await expect.poll(async () => (await admin.from("push_receipts").select("notification_result,badge_result").eq("id", receipt.data.id).single()).data)
      .toEqual({ notification_result: "FAILED", badge_result: "SUCCEEDED" });
    expect(await worker.evaluate(() => (globalThis as unknown as { __badge: number }).__badge)).toBe(1);
    const replay = await page.request.post("/api/notifications/receipt", { data: {
      token: receipt.data.token, stage: "COMPLETED", notificationResult: "SUCCEEDED", badgeResult: "FAILED",
    } });
    expect(replay.status()).toBe(204);
    expect((await admin.from("push_receipts").select("notification_result").eq("id", receipt.data.id).single()).data?.notification_result).toBe("FAILED");
    expect((await admin.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", userId)).count).toBe(0);
  } finally {
    await admin.auth.admin.deleteUser(userId);
  }
});

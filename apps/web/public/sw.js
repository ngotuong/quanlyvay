const CACHE_VERSION = "qlv-pwa-v1";
const PUBLIC_CACHE = "qlv-public-offline-v1";
const OFFLINE_DOCUMENT = "/offline.html";

self.addEventListener("install", (event) => event.waitUntil((async () => {
  // The only cached document is a static error screen without account or finance data.
  // Failure to cache it must not prevent push/service-worker installation.
  try { await (await caches.open(PUBLIC_CACHE)).add(OFFLINE_DOCUMENT); } catch { /* Network unavailable. */ }
  await self.skipWaiting();
})()));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("message", (event) => {
  if (event.data?.type === "QLV_PUSH_VERSION") event.ports?.[0]?.postMessage({ version: 122 });
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate" || new URL(request.url).origin !== self.location.origin) return;
  // Never cache authenticated HTML, RSC, API reads or financial writes. Always use
  // the network; only a failed document navigation receives the public error screen.
  event.respondWith(fetch(request).catch(async () => {
    const offline = await (await caches.open(PUBLIC_CACHE)).match(OFFLINE_DOCUMENT);
    const body = offline ? await offline.text() : '<!doctype html><html lang="vi"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mất kết nối</title><h1>Đang mất kết nối</h1><p>Kết nối lại Internet để tải dữ liệu mới.</p><a href="">Thử lại</a></html>';
    return new Response(body, { status: 503, headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    } });
  }));
});

function sameOriginDestination(value) {
  try {
    const url = new URL(value || "/notifications", self.location.origin);
    if (url.origin === self.location.origin) return url.href;
  } catch { /* Use the safe notification center. */ }
  return new URL("/notifications", self.location.origin).href;
}

async function reportPushReceipt(token, stage, results = {}) {
  if (typeof token !== "string" || !/^[0-9a-f]{64}$/.test(token)) return;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);
  try {
    await fetch("/api/notifications/receipt", {
      method: "POST", credentials: "omit", cache: "no-store", redirect: "error",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, stage, ...results }), signal: controller.signal,
    });
  } catch { /* Diagnostics must never prevent a visible notification or badge. */ }
  finally { clearTimeout(timeout); }
}

self.addEventListener("push", (event) => {
  // Declarative Push on WebKit supplies event.notification and null event.data.
  // Leave presentation to the browser instead of replacing its proposal with generic text.
  if (event.notification) {
    const token = event.notification.data?.receiptToken;
    event.waitUntil(Promise.allSettled([
      reportPushReceipt(token, "RECEIVED"),
      reportPushReceipt(token, "COMPLETED", { notificationResult: "DEFERRED", badgeResult: "SKIPPED" }),
    ]));
    return;
  }
  let payload = {};
  try { payload = event.data?.json() ?? {}; } catch { payload = { title: "Quản Lý Vay", body: event.data?.text() ?? "Bạn có thông báo mới." }; }
  if (!payload || typeof payload !== "object") payload = {};
  const notification = payload.web_push === 8030 && payload.notification ? payload.notification : {};
  const title = notification.title || payload.title || "Quản Lý Vay";
  const count = notification.app_badge !== undefined ? Number(notification.app_badge) : payload.badgeCount;
  // Start independently: a thrown/rejected badge call cannot skip showNotification, or vice versa.
  const showing = Promise.resolve().then(() => self.registration.showNotification(title, {
    body: notification.body || payload.body || "Bạn có thông báo mới.",
    icon: "/icons/brand-logo-192.png", badge: "/icons/brand-symbol-192.png",
    tag: notification.tag || payload.tag || CACHE_VERSION, renotify: false,
    data: { url: sameOriginDestination(notification.navigate || payload.url) },
  })).then(() => "SUCCEEDED", () => "FAILED");
  const badging = Promise.resolve().then(async () => {
    if (!("setAppBadge" in self.navigator)) return "UNSUPPORTED";
    if (!Number.isSafeInteger(count) || count < 0) return "SKIPPED";
    // setAppBadge(0) clears the badge, including platforms without clearAppBadge.
    await self.navigator.setAppBadge(count);
    return "SUCCEEDED";
  }).catch(() => "FAILED");
  const completion = Promise.all([showing, badging]).then(([notificationResult, badgeResult]) =>
    reportPushReceipt(payload.receiptToken, "COMPLETED", { notificationResult, badgeResult }));
  // Declarative-aware browsers display their proposed notification if showing fails.
  // A successful showNotification replaces that proposal instead of displaying it twice.
  event.waitUntil(Promise.allSettled([
    reportPushReceipt(payload.receiptToken, "RECEIVED"), completion,
  ]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = sameOriginDestination(event.notification.data?.url);
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url === target);
    return existing ? existing.focus() : self.clients.openWindow(target);
  }));
});

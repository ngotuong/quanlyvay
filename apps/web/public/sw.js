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

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() ?? {}; } catch { payload = { title: "Quản Lý Vay", body: event.data?.text() ?? "Bạn có thông báo mới." }; }
  const title = payload.title || "Quản Lý Vay";
  const tasks = [self.registration.showNotification(title, {
    body: payload.body || "Bạn có thông báo mới.",
    icon: "/icons/brand-logo-192.png",
    badge: "/icons/brand-symbol-192.png",
    tag: payload.tag || CACHE_VERSION,
    renotify: false,
    data: { url: payload.url || "/notifications" },
  })];
  if ("setAppBadge" in self.navigator && Number.isInteger(payload.badgeCount) && payload.badgeCount >= 0) {
    tasks.push(payload.badgeCount > 0 ? self.navigator.setAppBadge(payload.badgeCount) : self.navigator.clearAppBadge());
  }
  event.waitUntil(Promise.all(tasks));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/notifications", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => client.url === target);
    return existing ? existing.focus() : self.clients.openWindow(target);
  }));
});

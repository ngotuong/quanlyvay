const CACHE_VERSION = "qlv-pwa-v1";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() ?? {}; } catch { payload = { title: "Quản Lý Vay", body: event.data?.text() ?? "Bạn có thông báo mới." }; }
  const title = payload.title || "Quản Lý Vay";
  const tasks = [self.registration.showNotification(title, {
    body: payload.body || "Bạn có thông báo mới.",
    icon: "/icons/app-icon-192.png",
    badge: "/icons/app-icon-192.png",
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

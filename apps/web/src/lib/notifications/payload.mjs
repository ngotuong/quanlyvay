// Keep legacy fields while old service workers are still installed during rollout/rollback.
export function buildPushPayload({ title, body, path, tag, unreadCount, origin, receiptToken, mutable = false }) {
  const base = new URL(origin);
  const navigate = new URL(path, base);
  if (navigate.origin !== base.origin || !["https:", "http:"].includes(base.protocol)) throw new Error("Invalid Push destination");
  if (!Number.isSafeInteger(unreadCount) || unreadCount < 0) throw new Error("Invalid badge count");
  return {
    web_push: 8030,
    mutable,
    notification: {
      title, body, lang: "vi", dir: "ltr", navigate: navigate.href,
      icon: new URL("/icons/brand-logo-192.png", base).href,
      tag, silent: false, app_badge: String(unreadCount),
      ...(receiptToken ? { data: { receiptToken } } : {}),
    },
    title, body, url: navigate.pathname + navigate.search, tag, badgeCount: unreadCount,
    ...(receiptToken ? { receiptToken } : {}),
  };
}

export function deliveryPath(delivery) {
  return delivery.loan_id
    ? `/loans/${delivery.loan_id}?tab=overview${delivery.notification_type === "INTEREST_DUE" ? "&transaction=interest" : ""}`
    : "/notifications";
}

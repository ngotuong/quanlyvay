"use client";

import { useEffect } from "react";

export function PwaRegister({ unreadCount = 0 }: { unreadCount?: number }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (unreadCount > 0 && "setAppBadge" in navigator) {
      navigator.setAppBadge(unreadCount).catch(() => undefined);
    } else if (unreadCount === 0 && "clearAppBadge" in navigator) {
      navigator.clearAppBadge().catch(() => undefined);
    }
  }, [unreadCount]);

  return null;
}

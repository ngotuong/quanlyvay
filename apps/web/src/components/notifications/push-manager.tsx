"use client";

import { useState, useTransition } from "react";
import { BellRing, BellOff, LoaderCircle } from "lucide-react";
import { registerPushSubscriptionAction, removePushSubscriptionAction } from "@/app/actions/notifications";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

export function PushManager({ publicKey, initialEnabled }: { publicKey: string; initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

  function enable() {
    startTransition(async () => {
      if (!supported) return setMessage("Trình duyệt này chưa hỗ trợ Web Push.");
      if (!publicKey) return setMessage("Web Push local chưa được cấu hình khóa VAPID.");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return setMessage("Quyền thông báo chưa được cấp. Bạn có thể bật lại trong cài đặt trình duyệt.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      const json = subscription.toJSON();
      const result = await registerPushSubscriptionAction({ endpoint: subscription.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth });
      if (!result.ok) { await subscription.unsubscribe(); return setMessage(result.message); }
      setEnabled(true);
      setMessage(result.message);
    });
  }

  function disable() {
    startTransition(async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) { setEnabled(false); return setMessage("Thiết bị này không còn đăng ký Push."); }
      const result = await removePushSubscriptionAction(subscription.endpoint);
      if (result.ok) { await subscription.unsubscribe(); setEnabled(false); }
      setMessage(result.message);
    });
  }

  return <section className="surface-card push-settings" aria-labelledby="push-title">
    <span className="push-settings-icon" data-enabled={enabled}>{enabled ? <BellRing /> : <BellOff />}</span>
    <div className="push-settings-copy"><p className="eyebrow">Thiết bị hiện tại</p><h2 id="push-title">Thông báo Web Push</h2><p>{enabled ? "Thiết bị này đã đăng ký nhận nhắc hạn." : "Bật để nhận nhắc đúng ngày đóng lãi và lặp hằng ngày khi quá hạn."}</p></div>
    <button className={enabled ? "secondary-button" : "primary-button"} type="button" onClick={enabled ? disable : enable} disabled={pending || (!publicKey && !enabled)}>
      {pending ? <LoaderCircle className="spinner-icon" size={18} /> : enabled ? <BellOff size={18} /> : <BellRing size={18} />}
      {pending ? "Đang xử lý" : enabled ? "Tắt trên thiết bị" : "Bật thông báo"}
    </button>
    {!publicKey && !enabled ? <p className="push-config-note">Cần cấu hình `NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY` để thử Web Push local.</p> : null}
    <p className="push-feedback" aria-live="polite">{message}</p>
  </section>;
}

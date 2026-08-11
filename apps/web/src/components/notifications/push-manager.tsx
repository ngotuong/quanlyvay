"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing, BellOff, LoaderCircle } from "lucide-react";
import { registerPushSubscriptionAction, removePushSubscriptionAction } from "@/app/actions/notifications";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function PushManager({ publicKey }: { publicKey: string }) {
  const [enabled, setEnabled] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    if (!pushSupported()) {
      Promise.resolve().then(() => { if (active) setChecking(false); });
      return;
    }
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => { if (active) setEnabled(Boolean(subscription)); })
      .catch(() => { if (active) setMessage("Chưa thể kiểm tra trạng thái thông báo trên thiết bị này."); })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, []);

  function enable() {
    startTransition(async () => {
      if (!pushSupported()) return setMessage("Trình duyệt này chưa hỗ trợ thông báo trên thiết bị.");
      if (!publicKey) return setMessage("Chưa cấu hình khóa gửi thông báo cho môi trường này.");
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
      if (!pushSupported()) return setMessage("Trình duyệt này chưa hỗ trợ thông báo trên thiết bị.");
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) { setEnabled(false); return setMessage("Thiết bị này không còn đăng ký nhận thông báo."); }
      const result = await removePushSubscriptionAction(subscription.endpoint);
      if (result.ok) { await subscription.unsubscribe(); setEnabled(false); }
      setMessage(result.message);
    });
  }

  return <section className="surface-card push-settings" aria-labelledby="push-title">
    <span className="push-settings-icon" data-enabled={enabled}>{enabled ? <BellRing /> : <BellOff />}</span>
    <div className="push-settings-copy"><h2 id="push-title">Thông báo trên thiết bị</h2><p>{enabled ? "Thiết bị này đã đăng ký nhận nhắc hạn." : "Bật để nhận nhắc đúng ngày đóng lãi và lặp hằng ngày khi quá hạn."}</p></div>
    <button className={enabled ? "secondary-button" : "primary-button"} type="button" onClick={enabled ? disable : enable} disabled={pending || checking || (!publicKey && !enabled)}>
      {pending ? <LoaderCircle className="spinner-icon" size={18} /> : enabled ? <BellOff size={18} /> : <BellRing size={18} />}
      {pending ? "Đang xử lý" : checking ? "Đang kiểm tra" : enabled ? "Tắt trên thiết bị" : "Bật thông báo"}
    </button>
    {!publicKey && !enabled ? <p className="push-config-note">Chức năng gửi thông báo chưa được cấu hình.</p> : null}
    <p className="push-feedback" aria-live="polite">{message}</p>
  </section>;
}

"use client";

import { useEffect, useState, useTransition } from "react";
import { BellRing, BellOff, FlaskConical, LoaderCircle } from "lucide-react";
import { registerPushSubscriptionAction, removePushSubscriptionAction, updateNotificationDeliveryHourAction } from "@/app/actions/notifications";

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

const TEST_NOTIFICATION = {
  title: "Đến ngày thu lãi",
  body: "Duy • 50.000.000\nGiải ngân : 24/07/2024\nSố lãi phải thu : 3.000.000",
};

export function PushManager({ publicKey, initialDeliveryHour, showTestButton = false }: { publicKey: string; initialDeliveryHour: number; showTestButton?: boolean }) {
  const [enabled, setEnabled] = useState(false);
  const [deliveryHour, setDeliveryHour] = useState(initialDeliveryHour);
  const [savedDeliveryHour, setSavedDeliveryHour] = useState(initialDeliveryHour);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState("");
  const [testing, setTesting] = useState(false);
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

  function saveDeliveryHour(nextHour: number) {
    setDeliveryHour(nextHour);
    startTransition(async () => {
      const result = await updateNotificationDeliveryHourAction(nextHour);
      if (result.ok) setSavedDeliveryHour(nextHour);
      else setDeliveryHour(savedDeliveryHour);
      setMessage(result.message);
    });
  }

  async function testNotification() {
    setTesting(true);
    try {
      if (!("serviceWorker" in navigator) || !("Notification" in window)) {
        return setMessage("Trình duyệt này chưa hỗ trợ thông báo thử trên thiết bị.");
      }
      const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      if (permission !== "granted") {
        return setMessage("Quyền thông báo chưa được cấp. Bạn có thể bật lại trong cài đặt trình duyệt.");
      }
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(TEST_NOTIFICATION.title, {
        body: TEST_NOTIFICATION.body,
        icon: "/icons/brand-logo-192.png",
        badge: "/icons/brand-symbol-192.png",
        tag: "preview-interest-notification-test",
        data: { url: "/notifications" },
      });
      setMessage("Đã gửi thông báo mẫu trên thiết bị này. Không có dữ liệu nào được ghi vào hệ thống.");
    } catch {
      setMessage("Chưa thể hiển thị thông báo mẫu trên thiết bị này.");
    } finally {
      setTesting(false);
    }
  }

  return <section className="surface-card push-settings" aria-labelledby="push-title">
    <span className="push-settings-icon" data-enabled={enabled}>{enabled ? <BellRing /> : <BellOff />}</span>
    <div className="push-settings-copy"><h2 id="push-title">Thông báo trên thiết bị</h2><p>{enabled ? "Thiết bị này đã đăng ký nhận nhắc hạn." : "Bật để nhận nhắc đến hạn và nhắc lại mỗi ngày khi lãi chưa thanh toán."}</p></div>
    <button
      className="push-toggle"
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={enabled ? "Tắt thông báo trên thiết bị" : "Bật thông báo trên thiết bị"}
      title={enabled ? "Tắt thông báo trên thiết bị" : "Bật thông báo trên thiết bị"}
      onClick={enabled ? disable : enable}
      disabled={pending || checking || (!publicKey && !enabled)}
    >
      <span className="push-toggle-thumb">{pending || checking ? <LoaderCircle className="spinner-icon" size={14} aria-hidden="true" /> : null}</span>
    </button>
    <div className="notification-time-setting">
      <label htmlFor="notificationDeliveryHour">Giờ nhận thông báo</label>
      <select id="notificationDeliveryHour" value={deliveryHour} onChange={(event) => saveDeliveryHour(Number(event.target.value))} disabled={pending}>
        {Array.from({ length: 24 }, (_, hour) => <option value={hour} key={hour}>{String(hour).padStart(2, "0")}:00</option>)}
      </select>
    </div>
    {showTestButton ? <button className="secondary-button push-test-button" type="button" onClick={testNotification} disabled={testing}>
      {testing ? <LoaderCircle className="spinner-icon" size={18} /> : <FlaskConical size={18} />}
      {testing ? "Đang gửi thử" : "Gửi thông báo thử"}
    </button> : null}
    {!publicKey && !enabled ? <p className="push-config-note">Chức năng gửi thông báo chưa được cấu hình.</p> : null}
    <p className="push-feedback" aria-live="polite">{message}</p>
  </section>;
}

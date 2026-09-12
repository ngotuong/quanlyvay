"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "./button";

type ToastTone = "success" | "error" | "info";
type ToastDetail = { message: string; tone?: ToastTone };

export function notifyToast(message: string, tone: ToastTone = "info") {
  window.dispatchEvent(new CustomEvent<ToastDetail>("app:toast", { detail: { message, tone } }));
}

export function ToastProvider() {
  const [toast, setToast] = useState<(ToastDetail & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function show(event: Event) {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) return;
      if (timer.current) clearTimeout(timer.current);
      setToast({ ...detail, id: Date.now() });
      timer.current = setTimeout(() => setToast(null), 4200);
    }
    window.addEventListener("app:toast", show);
    return () => {
      window.removeEventListener("app:toast", show);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!toast) return <div className="ui-toast-region" aria-live="polite" aria-atomic="true" />;
  const Icon = toast.tone === "error" ? CircleAlert : CheckCircle2;
  return <div className="ui-toast-region" aria-live={toast.tone === "error" ? "assertive" : "polite"} aria-atomic="true">
    <div className="ui-toast" data-tone={toast.tone ?? "info"} role="status" aria-label={toast.message} key={toast.id}>
      <Icon size={20} aria-hidden="true" />
      <span className="ui-toast-copy" data-message={toast.message} aria-hidden="true" />
      <Button variant="ghost" className="ui-toast-close" aria-label="Đóng thông báo" onClick={() => setToast(null)}><X size={18} /></Button>
    </div>
  </div>;
}

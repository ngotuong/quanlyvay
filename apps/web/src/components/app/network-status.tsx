"use client";
import { useEffect, useState } from "react";

export function NetworkStatus() {
  const [disconnected, setDisconnected] = useState(false);

  useEffect(() => {
    let active = true;
    let needsCheck = !navigator.onLine;
    let controller: AbortController | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;

    function cancel() {
      clearTimeout(retry);
      clearTimeout(deadline);
      controller?.abort();
      controller = undefined;
    }

    async function check() {
      cancel();
      needsCheck = true;
      if (!active || document.visibilityState === "hidden") return;
      const request = new AbortController();
      controller = request;
      deadline = setTimeout(() => request.abort(), 5000);
      let reachable = false;
      try {
        const response = await fetch("/api/connectivity", {
          cache: "no-store", credentials: "omit", redirect: "error", signal: request.signal,
        });
        reachable = response.status === 204 && response.headers.get("x-qlv-connectivity") === "1";
      } catch {
        // Browser network hints are insufficient: only the actual request decides.
      }
      if (!active || controller !== request) return;
      clearTimeout(deadline);
      controller = undefined;
      setDisconnected(!reachable);
      needsCheck = !reachable || !navigator.onLine;
      if (needsCheck) retry = setTimeout(check, 15000);
    }

    function resume() {
      if (document.visibilityState === "hidden") cancel();
      else if (needsCheck || !navigator.onLine) void check();
    }

    // Normal online sessions add no polling; false-offline sessions are verified periodically.
    if (needsCheck) void check();
    window.addEventListener("online", check);
    window.addEventListener("offline", check);
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      active = false;
      cancel();
      window.removeEventListener("online", check);
      window.removeEventListener("offline", check);
      window.removeEventListener("focus", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  return disconnected ? <p role="alert" className="network-notice">Chưa kết nối được tới webapp. Dữ liệu có thể chưa cập nhật; hệ thống sẽ tự kiểm tra lại kết nối.</p> : null;
}

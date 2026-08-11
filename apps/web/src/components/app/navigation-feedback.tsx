"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const query = searchParams.toString();
  const routeKey = `${pathname}${query ? `?${query}` : ""}`;
  const pending = pendingTarget !== null && pendingTarget !== routeKey;

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (`${destination.pathname}${destination.search}` === `${window.location.pathname}${window.location.search}`) return;
      setPendingTarget(`${destination.pathname}${destination.search}`);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setPendingTarget(null), 8000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  return (
    <>
      <span className="route-progress global-route-progress" data-visible={pending} aria-hidden="true" />
      {pending ? <span className="sr-only" role="status" aria-live="polite">Đang mở nội dung…</span> : null}
    </>
  );
}

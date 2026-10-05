"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [transition, setTransition] = useState<{ source: string; target: string } | null>(null);
  const [slow, setSlow] = useState(false);
  const query = searchParams.toString();
  const routeKey = `${pathname}${query ? `?${query}` : ""}`;
  const pending = transition !== null && transition.source === routeKey && transition.target !== routeKey;
  // A committed route, including a redirect, completes the previous transition.
  if (transition && transition.source !== routeKey) {
    setTransition(null);
    setSlow(false);
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;
      if (`${destination.pathname}${destination.search}` === `${window.location.pathname}${window.location.search}`) return;
      const target = `${destination.pathname}${destination.search}`;
      window.setTimeout(() => {
        if (!(event as MouseEvent & { appNavigationCancelled?: boolean }).appNavigationCancelled) {
          setSlow(false);
          setTransition({ source: routeKey, target });
        }
      }, 0);
    };

    const handleHistoryNavigation = () => {
      setSlow(false);
      setTransition({ source: routeKey, target: `${window.location.pathname}${window.location.search}` });
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handleHistoryNavigation);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handleHistoryNavigation);
    };
  }, [routeKey]);

  useEffect(() => {
    if (!pending) return;
    const timeout = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timeout);
  }, [pending]);

  return (
    <>
      <span className="route-progress global-route-progress" data-visible={pending} aria-hidden="true" />
      {pending ? <span className="navigation-feedback-message" role="status" aria-live="polite"><span className="navigation-feedback-spinner" aria-hidden="true" />{slow ? "Nội dung đang tải lâu hơn dự kiến…" : "Đang mở nội dung…"}</span> : null}
    </>
  );
}

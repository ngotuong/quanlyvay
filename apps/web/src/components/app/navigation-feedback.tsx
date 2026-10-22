"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const minimumVisibleMs = 550;
const maximumVisibleMs = 15_000;
const navigationCancelledEvent = "app:navigation-cancelled";
type RouteTransition = { id: number; source: string; target: string; startedAt: number };

export function NavigationFeedback() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [transition, setTransition] = useState<RouteTransition | null>(null);
  const [slow, setSlow] = useState(false);
  const transitionId = useRef(0);
  const query = searchParams.toString();
  const routeKey = `${pathname}${query ? `?${query}` : ""}`;
  const pending = transition !== null;

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
          setTransition({ id: ++transitionId.current, source: routeKey, target, startedAt: performance.now() });
        }
      }, 0);
    };

    const handleHistoryNavigation = () => {
      const target = `${window.location.pathname}${window.location.search}`;
      setSlow(false);
      // Some browsers publish the restored Next route before their popstate
      // listeners run. In that order the destination is already painted and a
      // new transition would have identical source/target keys, so it could
      // never satisfy the completion effect below.
      if (target === routeKey) {
        setTransition(null);
        return;
      }
      setTransition({ id: ++transitionId.current, source: routeKey, target, startedAt: performance.now() });
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handleHistoryNavigation);
    const handleCancelledNavigation = () => { setTransition(null); setSlow(false); };
    window.addEventListener(navigationCancelledEvent, handleCancelledNavigation);
    return () => {
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handleHistoryNavigation);
      window.removeEventListener(navigationCancelledEvent, handleCancelledNavigation);
    };
  }, [routeKey]);

  useEffect(() => {
    if (!transition || routeKey === transition.source) return;
    let observer: MutationObserver | null = null;
    let firstFrame = 0;
    let secondFrame = 0;
    let timer = 0;
    let finishing = false;
    const finishWhenPainted = () => {
      if (finishing || document.querySelector(".content-loading,.initial-app-loading")) return;
      finishing = true;
      firstFrame = window.requestAnimationFrame(() => {
        secondFrame = window.requestAnimationFrame(() => {
          if (document.querySelector(".content-loading,.initial-app-loading")) {
            finishing = false;
            return;
          }
          const remaining = Math.max(0, minimumVisibleMs - (performance.now() - transition.startedAt));
          timer = window.setTimeout(() => {
            setTransition((current) => current?.id === transition.id ? null : current);
            setSlow(false);
          }, remaining);
        });
      });
    };
    observer = new MutationObserver(finishWhenPainted);
    observer.observe(document.body, { childList: true, subtree: true });
    finishWhenPainted();
    return () => {
      observer?.disconnect();
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(secondFrame);
      window.clearTimeout(timer);
    };
  }, [routeKey, transition]);

  useEffect(() => {
    if (!pending) return;
    const guarded = new Map<HTMLElement, { busy: string | null }>();
    const guardCurrentMain = () => {
      const main = document.querySelector<HTMLElement>("#main-content");
      if (!main || guarded.has(main)) return;
      guarded.set(main, { busy: main.getAttribute("aria-busy") });
      main.setAttribute("aria-busy", "true");
      main.dataset.navigationPending = "true";
    };
    const observer = new MutationObserver(guardCurrentMain);
    document.documentElement.dataset.navigationPending = "true";
    guardCurrentMain();
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      delete document.documentElement.dataset.navigationPending;
      for (const [main, previous] of guarded) {
        delete main.dataset.navigationPending;
        if (previous.busy === null) main.removeAttribute("aria-busy");
        else main.setAttribute("aria-busy", previous.busy);
      }
    };
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const slowTimeout = window.setTimeout(() => setSlow(true), 8000);
    const maximumTimeout = window.setTimeout(() => {
      setTransition(null);
      setSlow(false);
    }, maximumVisibleMs);
    return () => {
      window.clearTimeout(slowTimeout);
      window.clearTimeout(maximumTimeout);
    };
  }, [pending]);

  return (
    <>
      <span className="route-progress global-route-progress" data-visible={pending} aria-hidden="true" />
      {pending ? <span className="navigation-feedback-blocker" aria-hidden="true" /> : null}
      {pending ? <span className="navigation-feedback-message" role="status" aria-live="polite"><span className="navigation-feedback-spinner" aria-hidden="true" />{slow ? "Nội dung đang tải lâu hơn dự kiến…" : "Đang mở nội dung…"}</span> : null}
    </>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Timing = { kind: "document" | "response" | "content"; route: string; durationMs: number; ttfbMs?: number; bodyMs?: number; bytes?: number };
function routeCategory(pathname: string) {
  if (["/dashboard", "/loans", "/counterparties", "/notifications", "/expenses", "/settings", "/audit"].includes(pathname)) return pathname.slice(1);
  if (/^\/loans\/[^/]+$/.test(pathname)) return "loan-detail";
  return null;
}
const rounded = (value: number) => Math.round(value * 10) / 10;

// Bounded, in-memory diagnostics for the current document. Only route categories,
// durations and byte counts reach the DOM; no URL/query/ID, body, token or cookie.
// No telemetry is sent and no storage or fetch is added.
export function NavigationTiming() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  const [timings, setTimings] = useState<Timing[]>([]);
  const action = useRef<{ route: string; started: number } | null>(null);
  const append = useCallback((entry: Timing) => setTimings(previous => [...previous.slice(-9), entry]), []);

  useEffect(() => {
    const recordDocument = () => {
      const route = routeCategory(location.pathname);
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (!route || !navigation || !navigation.responseEnd) return;
      append({ kind: "document", route, durationMs: rounded(navigation.responseEnd), ttfbMs: rounded(navigation.responseStart - navigation.requestStart), bodyMs: rounded(navigation.responseEnd - navigation.responseStart), bytes: navigation.decodedBodySize });
    };
    if (document.readyState === "complete") recordDocument();
    else window.addEventListener("load", recordDocument, { once: true });
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const destination = new URL(anchor.href, location.href);
      if (destination.origin !== location.origin || destination.pathname + destination.search === location.pathname + location.search) return;
      const route = routeCategory(destination.pathname);
      if (route) action.current = { route, started: performance.now() };
    };
    const pop = () => {
      const route = routeCategory(location.pathname);
      if (route) action.current = { route, started: performance.now() };
    };
    document.addEventListener("click", click, true);
    window.addEventListener("popstate", pop);
    let observer: PerformanceObserver | undefined;
    if (typeof PerformanceObserver !== "undefined") {
      observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          const url = new URL(resource.name, location.href);
          const route = routeCategory(url.pathname);
          if (url.origin !== location.origin || !url.searchParams.has("_rsc") || !route) continue;
          append({ kind: "response", route, durationMs: rounded(resource.duration), ttfbMs: rounded(resource.responseStart - resource.requestStart), bodyMs: rounded(resource.responseEnd - resource.responseStart), bytes: resource.decodedBodySize });
        }
      });
      observer.observe({ type: "resource", buffered: true });
    }
    return () => { observer?.disconnect(); document.removeEventListener("click", click, true); window.removeEventListener("popstate", pop); window.removeEventListener("load", recordDocument); };
  }, [append]);

  useEffect(() => {
    const current = action.current;
    if (!current || current.route !== routeCategory(pathname)) return;
    let finished = false;
    let frame = 0;
    const recordReady = () => {
      if (finished || !document.querySelector("#main-content") || document.querySelector(".content-loading,.initial-app-loading")) return;
      finished = true;
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => {
        if (action.current !== current) return;
        append({ kind: "content", route: current.route, durationMs: rounded(performance.now() - current.started) });
        action.current = null; // A later programmatic refresh must not reuse this click.
      }); });
    };
    const observer = new MutationObserver(recordReady);
    observer.observe(document.body, { childList: true, subtree: true });
    recordReady();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, [append, pathname, query]);

  return <output hidden aria-hidden="true" data-navigation-timing={JSON.stringify(timings)} />;
}

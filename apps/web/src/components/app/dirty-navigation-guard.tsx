"use client";

import { useLayoutEffect } from "react";

// DOM events share the registry across independently compiled client entry chunks.
const draftEvent = "app:check-unsaved-draft";
export function registerDraft(isDirty: () => boolean) {
  const check = (event: Event) => {
    if (isDirty()) (event as CustomEvent<{ dirty: boolean }>).detail.dirty = true;
  };
  window.addEventListener(draftEvent, check);
  return () => window.removeEventListener(draftEvent, check);
}
function hasDraft() {
  const detail = { dirty: false };
  window.dispatchEvent(new CustomEvent(draftEvent, { detail }));
  return detail.dirty;
}
const message = "Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?";
const key = "qlvHistoryIndex";

// Preserve Next's history state and entries. A rejected traversal is restored before
// Next receives popstate, so the form tree (and its in-memory draft) stays mounted.
export function DirtyNavigationGuard() {
  useLayoutEffect(() => {
    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);
    let index = Number(history.state?.[key] ?? 0);
    let restoring = false;
    let savedFocus: HTMLElement | null = null;
    let savedScroll = { x: 0, y: 0 };
    replace({ ...history.state, [key]: index }, "");
    history.pushState = (state, unused, url) => {
      push({ ...state, [key]: ++index }, unused, url);
    };
    history.replaceState = (state, unused, url) => replace({ ...state, [key]: index }, unused, url);
    const pop = (event: PopStateEvent) => {
      if (restoring) {
        restoring = false;
        event.stopImmediatePropagation();
        savedFocus?.focus({ preventScroll: true });
        window.scrollTo(savedScroll.x, savedScroll.y);
        return;
      }
      const target = event.state?.[key];
      if (typeof target !== "number" || target === index) return;
      if (hasDraft() && !window.confirm(message)) {
        event.stopImmediatePropagation();
        savedFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        savedScroll = { x: scrollX, y: scrollY };
        restoring = true;
        history.go(index - target);
      } else index = target;
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download") || !hasDraft()) return;
      const to = new URL(link.href, location.href);
      if (to.origin !== location.origin || (to.pathname === location.pathname && to.search === location.search)) return;
      if (!window.confirm(message)) {
        (event as MouseEvent & { appNavigationCancelled?: boolean }).appNavigationCancelled = true;
        event.preventDefault(); event.stopPropagation();
      }
    };
    const unload = (event: BeforeUnloadEvent) => { if (hasDraft()) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("popstate", pop, true);
    document.addEventListener("click", click, true);
    window.addEventListener("beforeunload", unload);
    return () => {
      history.pushState = push; history.replaceState = replace;
      window.removeEventListener("popstate", pop, true);
      document.removeEventListener("click", click, true);
      window.removeEventListener("beforeunload", unload);
    };
  }, []);
  return null;
}

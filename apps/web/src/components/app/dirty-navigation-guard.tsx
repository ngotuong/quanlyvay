"use client";

import { useLayoutEffect } from "react";
import { notifyToast } from "@/components/ui";

// DOM events share the registry across independently compiled client entry chunks.
const draftEvent = "app:check-unsaved-draft";
export function registerDraft(isDirty: () => boolean, isPending: () => boolean = () => false) {
  const check = (event: Event) => {
    const detail = (event as CustomEvent<{ dirty: boolean; pending: boolean }>).detail;
    if (isDirty()) detail.dirty = true;
    if (isPending()) detail.pending = true;
  };
  window.addEventListener(draftEvent, check);
  return () => window.removeEventListener(draftEvent, check);
}
function hasDraft() {
  const detail = { dirty: false, pending: false };
  window.dispatchEvent(new CustomEvent(draftEvent, { detail }));
  if (!detail.dirty) detail.dirty = Boolean(document.querySelector("#main-content form[data-navigation-dirty='true']"));
  return detail;
}
function clearDomDrafts() {
  for (const form of document.querySelectorAll<HTMLFormElement>("#main-content form[data-navigation-dirty='true']")) delete form.dataset.navigationDirty;
}
const message = "Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?";
const key = "qlvHistoryIndex";
const navigationCancelledEvent = "app:navigation-cancelled";

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
        window.dispatchEvent(new Event(navigationCancelledEvent));
        savedFocus?.focus({ preventScroll: true });
        window.scrollTo(savedScroll.x, savedScroll.y);
        return;
      }
      const target = event.state?.[key];
      if (typeof target !== "number" || target === index) return;
      const draft = hasDraft();
      if (draft.pending) notifyToast("Đang lưu thay đổi. Vui lòng chờ kết quả.");
      if (draft.pending || (draft.dirty && !window.confirm(message))) {
        event.stopImmediatePropagation();
        savedFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        savedScroll = { x: scrollX, y: scrollY };
        restoring = true;
        window.dispatchEvent(new Event(navigationCancelledEvent));
        history.go(index - target);
      } else { clearDomDrafts(); index = target; }
    };
    const markDraft = (event: Event) => {
      const form = event.target instanceof Element ? event.target.closest<HTMLFormElement>("form[data-navigation-draft='true']") : null;
      if (form?.closest("#main-content")) form.dataset.navigationDirty = "true";
    };
    const click = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const to = new URL(link.href, location.href);
      if (to.origin !== location.origin || (to.pathname === location.pathname && to.search === location.search)) return;
      const draft = hasDraft();
      if (!draft.dirty && !draft.pending) return;
      if (draft.pending) notifyToast("Đang lưu thay đổi. Vui lòng chờ kết quả.");
      if (draft.pending || !window.confirm(message)) {
        (event as MouseEvent & { appNavigationCancelled?: boolean }).appNavigationCancelled = true;
        event.preventDefault(); event.stopPropagation();
        window.dispatchEvent(new Event(navigationCancelledEvent));
      } else clearDomDrafts();
    };
    const unload = (event: BeforeUnloadEvent) => { const draft = hasDraft(); if (draft.dirty || draft.pending) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("popstate", pop, true);
    document.addEventListener("click", click, true);
    document.addEventListener("input", markDraft, true);
    document.addEventListener("change", markDraft, true);
    window.addEventListener("beforeunload", unload);
    return () => {
      history.pushState = push; history.replaceState = replace;
      window.removeEventListener("popstate", pop, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("input", markDraft, true);
      document.removeEventListener("change", markDraft, true);
      window.removeEventListener("beforeunload", unload);
    };
  }, []);
  return null;
}

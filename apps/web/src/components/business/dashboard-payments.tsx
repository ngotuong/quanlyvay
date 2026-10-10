"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { usePrivacy } from "@/components/app/privacy-provider";
import { registerDraft } from "@/components/app/dirty-navigation-guard";
import { afterSheetExit } from "@/components/ui/sheet-exit";
import { notifyToast } from "@/components/ui";

const Drawer = dynamic(() => import("./dashboard-payment-drawer"), { ssr: false, loading: () => <p role="status">Đang mở biểu mẫu…</p> });
const changed = "app:dashboard-payment-history";
const marker = "qlvDashboardPayment";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function snapshot() {
  const id = new URLSearchParams(location.hash.slice(1)).get("payment");
  return location.pathname === "/dashboard" && id && uuid.test(id) ? id : null;
}
function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback);
  window.addEventListener(changed, callback);
  // Hash traversal also emits hashchange after popstate. Listening to it would bypass
  // DirtyNavigationGuard's rejected traversal while history is being restored.
  return () => { window.removeEventListener("popstate", callback); window.removeEventListener(changed, callback); };
}
function announce() { window.dispatchEvent(new Event(changed)); }
type OpenPayment = (id: string, trigger: HTMLAnchorElement) => void;
const Payments = createContext<OpenPayment | null>(null);

export function DashboardPayments({ children }: { children: ReactNode }) {
  const { isPrivacyMode } = usePrivacy();
  const active = useSyncExternalStore(subscribe, snapshot, () => null);
  const activity = useRef({ dirty: false, pending: false });
  const trigger = useRef<HTMLAnchorElement | null>(null);
  const closing = useRef(false);
  const cancelExit = useRef<(() => void) | null>(null);
  const stopFocusRecovery = useRef<(() => void) | null>(null);
  useEffect(() => registerDraft(() => activity.current.dirty, () => activity.current.pending || closing.current), []);
  useEffect(() => () => { stopFocusRecovery.current?.(); cancelExit.current?.(); }, []);
  useEffect(() => {
    if (!active) { activity.current = { dirty: false, pending: false }; closing.current = false; }
    if (isPrivacyMode && active) {
      activity.current = { dirty: false, pending: false };
      const state = { ...history.state }; delete state[marker];
      history.replaceState(state, "", location.pathname + location.search);
      announce();
    }
  }, [active, isPrivacyMode]);

  function focusReturn() {
    stopFocusRecovery.current?.();
    const href = trigger.current?.getAttribute("href");
    let returned: HTMLElement | null = null;
    function restore() {
      if (location.pathname !== "/dashboard" || document.querySelector("dialog[open]")) return;
      returned = (href ? document.querySelector<HTMLAnchorElement>(`.attention-card a.due-item[href="${CSS.escape(href)}"]`) : null)
        ?? document.querySelector<HTMLElement>("#schedule-title") ?? document.querySelector<HTMLElement>("#main-content");
      returned?.focus({ preventScroll: true });
    }
    // Native dialog cleanup runs before React removes its DOM. Focus after that commit,
    // then recover only if the server's refreshed task tree removes the returned target.
    const frame = requestAnimationFrame(restore);
    const observer = new MutationObserver(() => {
      if (returned && !returned.isConnected && document.activeElement === document.body) restore();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    const stop = () => { cancelAnimationFrame(frame); observer.disconnect(); clearTimeout(timer); };
    const timer = setTimeout(stop, 3000);
    stopFocusRecovery.current = stop;
  }
  function open(id: string, source: HTMLAnchorElement) {
    if (closing.current) return;
    if (isPrivacyMode) { notifyToast("Hãy hiển thị số tiền để ghi giao dịch."); return; }
    if (activity.current.pending) { notifyToast("Đang lưu thay đổi. Vui lòng chờ kết quả."); return; }
    const selected = snapshot();
    if (selected === id) { document.querySelector<HTMLDialogElement>(".dashboard-payment-drawer")?.focus(); return; }
    if (activity.current.dirty && !window.confirm("Đóng và bỏ các thay đổi chưa lưu?")) return;
    stopFocusRecovery.current?.();
    activity.current = { dirty: false, pending: false }; closing.current = false; trigger.current = source;
    const existing = history.state?.[marker];
    const returnUrl = selected && existing?.returnUrl ? existing.returnUrl : location.pathname + location.search + location.hash;
    const url = location.pathname + location.search + "#payment=" + id;
    const state = { ...history.state, [marker]: { loanId: id, returnUrl } };
    if (selected) history.replaceState(state, "", url); else history.pushState(state, "", url);
    announce();
  }
  function close(message?: string) {
    if (closing.current || (!message && activity.current.pending)) return;
    if (!message && activity.current.dirty && !window.confirm("Đóng và bỏ các thay đổi chưa lưu?")) return;
    closing.current = true;
    cancelExit.current = afterSheetExit(document.querySelector<HTMLDialogElement>(".dashboard-payment-drawer"), () => {
      // One registry owns the Dashboard session: an accepted close must not ask again on popstate.
      activity.current = { dirty: false, pending: false };
      closing.current = false;
      const owned = history.state?.[marker];
      if (message) {
        // Remove the saved form from this history entry; Forward must never reopen a successful submission.
        const state = { ...history.state }; delete state[marker];
        history.replaceState(state, "", owned?.returnUrl ?? location.pathname + location.search);
        announce();
        notifyToast(message, "success");
      } else if (owned?.loanId === active) history.back();
      else {
        const state = { ...history.state }; delete state[marker];
        history.replaceState(state, "", location.pathname + location.search);
        announce();
      }
    });
  }

  return <Payments.Provider value={open}>{children}{active && !isPrivacyMode ? <Drawer key={active} loanId={active}
    onDirtyChange={dirty => { activity.current.dirty = dirty; }} onPendingChange={pending => { activity.current.pending = pending; }}
    onClose={close} onUnmount={focusReturn} /> : null}</Payments.Provider>;
}

export function DashboardInterestLink({ loanId, children }: { loanId: string; children: ReactNode }) {
  const open = useContext(Payments);
  return <Link href={`/loans/${loanId}?transaction=interest`} prefetch={false} className="due-item" onClick={event => {
    if (!open || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    open(loanId, event.currentTarget);
  }}>{children}</Link>;
}

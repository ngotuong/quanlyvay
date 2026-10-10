"use client";

import { X } from "lucide-react";
import { forwardRef, useEffect, useId, useRef, type DialogHTMLAttributes, type KeyboardEvent, type PointerEvent } from "react";
import { Button } from "./button";
import { cx } from "./utils";

type BottomSheetProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, "title"> & {
  title: string;
  eyebrow?: string;
  onRequestClose: () => void;
  closeDisabled?: boolean;
  titleId?: string;
};

export const BottomSheet = forwardRef<HTMLDialogElement, BottomSheetProps>(function BottomSheet({ children, className, eyebrow, onRequestClose, closeDisabled = false, title, titleId, onKeyDown, ...props }, ref) {
  const gesture = useRef<{ start: number; latest: number; pointerId: number } | null>(null);
  const dialog = useRef<HTMLDialogElement | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const generatedTitleId = useId();

  function resetDrag() {
    gesture.current = null;
    dialog.current?.removeAttribute("data-dragging");
    dialog.current?.style.removeProperty("--sheet-backdrop-opacity");
    if (surface.current) surface.current.style.transform = "";
  }
  useEffect(() => { if (closeDisabled) resetDrag(); }, [closeDisabled]);

  function drag(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (closeDisabled || !current || event.pointerId !== current.pointerId || !surface.current) return;
    current.latest = event.clientY;
    const distance = Math.max(0, event.clientY - current.start);
    const damped = Math.min(180, distance / (1 + distance / 360));
    surface.current.style.transform = `translateY(${damped}px)`;
    dialog.current?.style.setProperty("--sheet-backdrop-opacity", String(1 - Math.min(.4, distance / 600)));
  }
  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const distance = event.clientY - current.start;
    resetDrag();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (distance > 88 && !closeDisabled) onRequestClose();
  }

  const headingId = titleId ?? generatedTitleId;

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )].filter((element) => element.getClientRects().length > 0 && element.getAttribute("aria-hidden") !== "true");
    if (controls.length === 0) {
      event.preventDefault();
      event.currentTarget.focus();
      return;
    }
    const first = controls[0];
    const last = controls.at(-1)!;
    // The key event target is the element that owned focus when Tab was
    // pressed. document.activeElement can already be the dialog/body while a
    // native modal is moving focus, which makes the boundary check racy.
    const active = event.target instanceof HTMLElement ? event.target : document.activeElement;
    if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !event.currentTarget.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  return <dialog {...props} aria-labelledby={headingId} className={cx("transaction-dialog", "ui-bottom-sheet", className)} ref={element => { dialog.current = element; if (typeof ref === "function") ref(element); else if (ref) ref.current = element; }}
    tabIndex={-1}
    onKeyDown={onKeyDown}
    onKeyDownCapture={trapFocus}
    onCancel={(event) => { event.preventDefault(); if (!closeDisabled) onRequestClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget && !closeDisabled) onRequestClose(); }}>
    <div className="ui-bottom-sheet-surface" ref={surface}>
      <div className="ui-sheet-grabber" aria-hidden="true" onPointerDown={(event) => {
        if (closeDisabled || gesture.current || !event.isPrimary || event.button !== 0) return;
        gesture.current = { start: event.clientY, latest: event.clientY, pointerId: event.pointerId };
        dialog.current?.setAttribute("data-dragging", "true");
        event.currentTarget.setPointerCapture(event.pointerId);
      }} onPointerMove={drag} onPointerUp={endDrag} onLostPointerCapture={resetDrag} onPointerCancel={resetDrag}><span /></div>
      <div className="dialog-heading"><div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h2 id={headingId}>{title}</h2></div><Button variant="ghost" className="icon-button" data-bottom-sheet-close aria-label={closeDisabled ? `Đang lưu ${title.toLocaleLowerCase("vi")}` : `Đóng ${title.toLocaleLowerCase("vi")}`} disabled={closeDisabled} onClick={onRequestClose}><X size={20} /></Button></div>
      {children}
    </div>
  </dialog>;
});

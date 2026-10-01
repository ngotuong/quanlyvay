"use client";

import { X } from "lucide-react";
import { forwardRef, useId, useRef, type DialogHTMLAttributes, type KeyboardEvent, type PointerEvent } from "react";
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
  const dragStart = useRef<number | null>(null);
  const dragLatest = useRef<number | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const generatedTitleId = useId();

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (closeDisabled || dragStart.current === null || !surface.current) return;
    dragLatest.current = event.clientY;
    const distance = Math.max(0, event.clientY - dragStart.current);
    surface.current.style.transform = `translateY(${Math.min(distance, 180)}px)`;
  }

  function finishDrag(clientY: number) {
    if (dragStart.current === null || !surface.current) return;
    const distance = clientY - dragStart.current;
    dragStart.current = null;
    dragLatest.current = null;
    surface.current.style.transform = "";
    if (distance > 88 && !closeDisabled) onRequestClose();
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    finishDrag(event.clientY);
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
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !event.currentTarget.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !event.currentTarget.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  }

  return <dialog {...props} aria-labelledby={headingId} className={cx("transaction-dialog", "ui-bottom-sheet", className)} ref={ref}
    tabIndex={-1}
    onKeyDown={onKeyDown}
    onKeyDownCapture={trapFocus}
    onCancel={(event) => { event.preventDefault(); if (!closeDisabled) onRequestClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget && !closeDisabled) onRequestClose(); }}>
    <div className="ui-bottom-sheet-surface" ref={surface}>
      <div className="ui-sheet-grabber" aria-hidden="true" onPointerDown={(event) => { if (closeDisabled) return; dragStart.current = event.clientY; dragLatest.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={drag} onPointerUp={endDrag} onLostPointerCapture={() => { if (dragLatest.current !== null) finishDrag(dragLatest.current); }} onPointerCancel={() => { dragStart.current = null; dragLatest.current = null; if (surface.current) surface.current.style.transform = ""; }}><span /></div>
      <div className="dialog-heading"><div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h2 id={headingId}>{title}</h2></div><Button variant="ghost" className="icon-button" data-bottom-sheet-close aria-label={closeDisabled ? `Đang lưu ${title.toLocaleLowerCase("vi")}` : `Đóng ${title.toLocaleLowerCase("vi")}`} disabled={closeDisabled} onClick={onRequestClose}><X size={20} /></Button></div>
      {children}
    </div>
  </dialog>;
});

"use client";

import { X } from "lucide-react";
import { forwardRef, useId, useRef, type DialogHTMLAttributes, type PointerEvent } from "react";
import { Button } from "./button";
import { cx } from "./utils";

type BottomSheetProps = Omit<DialogHTMLAttributes<HTMLDialogElement>, "title"> & {
  title: string;
  eyebrow?: string;
  onRequestClose: () => void;
  titleId?: string;
};

export const BottomSheet = forwardRef<HTMLDialogElement, BottomSheetProps>(function BottomSheet({ children, className, eyebrow, onRequestClose, title, titleId, ...props }, ref) {
  const dragStart = useRef<number | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const generatedTitleId = useId();

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null || !surface.current) return;
    const distance = Math.max(0, event.clientY - dragStart.current);
    surface.current.style.transform = `translateY(${Math.min(distance, 180)}px)`;
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragStart.current === null || !surface.current) return;
    const distance = event.clientY - dragStart.current;
    dragStart.current = null;
    surface.current.style.transform = "";
    if (distance > 88) onRequestClose();
  }

  const headingId = titleId ?? generatedTitleId;
  return <dialog {...props} aria-labelledby={headingId} className={cx("transaction-dialog", "ui-bottom-sheet", className)} ref={ref}
    onCancel={(event) => { event.preventDefault(); onRequestClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onRequestClose(); }}>
    <div className="ui-bottom-sheet-surface" ref={surface}>
      <div className="ui-sheet-grabber" aria-hidden="true" onPointerDown={(event) => { dragStart.current = event.clientY; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag}><span /></div>
      <div className="dialog-heading"><div>{eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}<h2 id={headingId}>{title}</h2></div><Button variant="ghost" className="icon-button" aria-label={`Đóng ${title.toLocaleLowerCase("vi")}`} onClick={onRequestClose}><X size={20} /></Button></div>
      {children}
    </div>
  </dialog>;
});

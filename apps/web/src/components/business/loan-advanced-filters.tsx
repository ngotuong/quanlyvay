"use client";

import { useEffect, useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export function LoanAdvancedFilters({ disbursedFrom, disbursedTo, sort, active, onChange }: { disbursedFrom: string; disbursedTo: string; sort: "newest" | "oldest" | "outstanding_desc" | "name"; active: boolean; onChange: (patch: { disbursedFrom?: string; disbursedTo?: string; sort?: "newest" | "oldest" | "outstanding_desc" | "name" }) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function openDialog() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.classList.remove("is-closing");
    if (!dialog.open) dialog.showModal();
  }

  function closeDialog() {
    const dialog = dialogRef.current;
    if (!dialog?.open || dialog.classList.contains("is-closing")) return;
    dialog.classList.add("is-closing");
    closeTimer.current = setTimeout(() => {
      dialog.close();
      dialog.classList.remove("is-closing");
      closeTimer.current = null;
    }, 180);
  }

  return <div className="loan-advanced-filter-control">
    <button className="secondary-button advanced-filter-trigger" type="button" onClick={openDialog} data-active={active}><SlidersHorizontal size={17} />Nâng cao{active ? " · đang dùng" : ""}</button>
    <dialog aria-labelledby="loan-filter-dialog-title" className="transaction-dialog loan-filter-dialog" ref={dialogRef} onCancel={(event) => { event.preventDefault(); closeDialog(); }} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
      <div className="dialog-heading"><div><p className="eyebrow">Bộ lọc nâng cao</p><h2 id="loan-filter-dialog-title">Ngày giải ngân và sắp xếp</h2></div><button className="icon-button" type="button" aria-label="Đóng bộ lọc nâng cao" onClick={closeDialog}><X size={20} /></button></div>
      <div className="advanced-filter-grid dialog-form">
        <div className="field-group advanced-filter-date"><label htmlFor="loanFrom">Từ</label><input id="loanFrom" name="from" type="date" value={disbursedFrom} onChange={(event) => onChange({ disbursedFrom: event.target.value })} /></div>
        <div className="field-group advanced-filter-date"><label htmlFor="loanTo">Đến</label><input id="loanTo" name="to" type="date" value={disbursedTo} onChange={(event) => onChange({ disbursedTo: event.target.value })} /></div>
        <div className="field-group advanced-filter-sort"><label htmlFor="loanSort">Sắp xếp</label><select id="loanSort" name="sort" value={sort} onChange={(event) => onChange({ sort: event.target.value as "newest" | "oldest" | "outstanding_desc" | "name" })}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="outstanding_desc">Dư nợ lớn nhất</option><option value="name">Tên A–Z</option></select></div>
        <div className="advanced-filter-dialog-actions"><p>Kết quả được cập nhật ngay khi bạn thay đổi điều kiện.</p></div>
      </div>
    </dialog>
  </div>;
}

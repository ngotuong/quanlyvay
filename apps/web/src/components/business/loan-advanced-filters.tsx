"use client";

import { useEffect, useRef } from "react";
import { SlidersHorizontal, X } from "lucide-react";

export function LoanAdvancedFilters({ disbursedFrom, disbursedTo, sort, active }: { disbursedFrom?: string; disbursedTo?: string; sort: "newest" | "oldest" | "outstanding_desc" | "name"; active: boolean }) {
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
      <div className="dialog-heading"><div><p className="eyebrow">Bộ lọc nâng cao</p><h2 id="loan-filter-dialog-title">Ngày giải ngân và sắp xếp</h2></div><button className="icon-button" type="button" aria-label="Đóng" onClick={closeDialog}><X size={20} /></button></div>
      <div className="advanced-filter-grid dialog-form">
        <div className="field-group"><label htmlFor="loanFrom">Giải ngân từ</label><input id="loanFrom" name="from" type="date" defaultValue={disbursedFrom} /></div>
        <div className="field-group"><label htmlFor="loanTo">Đến ngày</label><input id="loanTo" name="to" type="date" defaultValue={disbursedTo} /></div>
        <div className="field-group"><label htmlFor="loanSort">Sắp xếp</label><select id="loanSort" name="sort" defaultValue={sort}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="outstanding_desc">Dư nợ lớn nhất</option><option value="name">Tên A–Z</option></select></div>
        <div className="dialog-actions advanced-filter-dialog-actions"><button className="secondary-button" type="button" onClick={closeDialog}>Hủy</button><button className="primary-button" type="submit">Áp dụng bộ lọc</button></div>
      </div>
    </dialog>
  </div>;
}

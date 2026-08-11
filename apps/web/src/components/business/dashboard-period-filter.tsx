"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CalendarRange, SlidersHorizontal, X } from "lucide-react";
import type { DashboardPeriod } from "@/lib/business/dashboard-period";

export function DashboardPeriodFilter({ period, periodLabel }: { period: DashboardPeriod; periodLabel: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function openDialog() {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
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

  return (
    <section className="dashboard-period-bar" aria-label="Khoảng báo cáo">
      <span className="dashboard-period-current"><CalendarRange size={18} aria-hidden="true" /><span><small>Khoảng báo cáo</small><strong>{periodLabel}</strong></span></span>
      <nav className="filter-shortcuts dashboard-shortcuts" aria-label="Khoảng thời gian nhanh">
        <Link href="/dashboard?preset=this_month" data-active={period.preset === "this_month"}>Tháng này</Link>
        <Link href="/dashboard?preset=previous_month" data-active={period.preset === "previous_month"}>Tháng trước</Link>
        <Link href="/dashboard?preset=year_to_date" data-active={period.preset === "year_to_date"}>Năm nay</Link>
        <Link href="/dashboard?preset=six_months" data-active={period.preset === "six_months"}>6 tháng</Link>
      </nav>
      <button className="secondary-button dashboard-custom-trigger" type="button" onClick={openDialog}><SlidersHorizontal size={17} aria-hidden="true" />Tùy chỉnh</button>
      <dialog aria-labelledby="dashboard-period-dialog-title" className="transaction-dialog dashboard-period-dialog" ref={dialogRef} onCancel={(event) => { event.preventDefault(); closeDialog(); }} onClick={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
        <div className="dialog-heading"><div><p className="eyebrow">Khoảng báo cáo</p><h2 id="dashboard-period-dialog-title">Chọn ngày tùy chỉnh</h2></div><button className="icon-button" type="button" aria-label="Đóng" onClick={closeDialog}><X size={20} /></button></div>
        <form className="filter-form dashboard-date-form dialog-form" method="get" key={`${period.start}:${period.end}`}>
          <div className="field-group"><label htmlFor="dashboardFrom">Từ ngày</label><input id="dashboardFrom" name="from" type="date" defaultValue={period.start} required /></div>
          <div className="field-group"><label htmlFor="dashboardTo">Đến ngày</label><input id="dashboardTo" name="to" type="date" defaultValue={period.end} required /></div>
          <button className="primary-button filter-submit" type="submit">Áp dụng</button>
        </form>
      </dialog>
    </section>
  );
}

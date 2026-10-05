"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarRange, SlidersHorizontal } from "lucide-react";
import type { DashboardPeriod } from "@/lib/business/dashboard-period";
import { BottomSheet, Button, Input, TabList, Tabs } from "@/components/ui";

export function DashboardPeriodFilter({ period, periodLabel }: { period: DashboardPeriod; periodLabel: string }) {
  const router = useRouter();
  // Compact the displayed date range only when the shared month/year remains explicit.
  const endDateLabel = `${Number(period.end.slice(8, 10))}/${Number(period.end.slice(5, 7))}/${period.end.slice(0, 4)}`;
  const compactPeriodLabel = period.start === period.end ? endDateLabel
    : period.start.slice(0, 7) === period.end.slice(0, 7)
      ? `${Number(period.start.slice(8, 10))}–${endDateLabel}` : periodLabel;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dates, setDates] = useState({ from: period.start, to: period.end });
  const periodKey = `${period.start}:${period.end}`;
  const [syncedPeriodKey, setSyncedPeriodKey] = useState(periodKey);
  const [pending, startTransition] = useTransition();

  if (syncedPeriodKey !== periodKey) {
    setSyncedPeriodKey(periodKey);
    setDates({ from: period.start, to: period.end });
  }

  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);

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

  function updateDate(key: "from" | "to", value: string) {
    const next = { ...dates, [key]: value };
    setDates(next);
    if (!next.from || !next.to || next.from > next.to) return;
    const params = new URLSearchParams({ from: next.from, to: next.to });
    startTransition(() => router.replace(`/dashboard?${params.toString()}`, { scroll: false }));
  }

  return (
    <section className="dashboard-period-bar" aria-label="Khoảng báo cáo">
      <span className="dashboard-period-current"><CalendarRange size={18} aria-hidden="true" /><span><small>Khoảng báo cáo</small><strong title={periodLabel} aria-label={periodLabel}>{compactPeriodLabel}</strong></span></span>
      <Tabs className="filter-shortcuts dashboard-shortcuts" aria-label="Khoảng thời gian nhanh"><TabList>
        <Link href="/dashboard?preset=this_month" data-active={period.preset === "this_month"}>Tháng này</Link>
        <Link href="/dashboard?preset=previous_month" data-active={period.preset === "previous_month"}>Tháng trước</Link>
        <Link href="/dashboard?preset=year_to_date" data-active={period.preset === "year_to_date"}>Năm nay</Link>
        <Link href="/dashboard?preset=six_months" data-active={period.preset === "six_months"}>6 tháng</Link>
      </TabList></Tabs>
      <Button variant="secondary" className="secondary-button dashboard-custom-trigger" type="button" onClick={openDialog}><SlidersHorizontal size={17} aria-hidden="true" />Tùy chỉnh</Button>
      <BottomSheet eyebrow="Khoảng báo cáo" title="Chọn ngày tùy chỉnh" titleId="dashboard-period-dialog-title" className="dashboard-period-dialog" ref={dialogRef} onRequestClose={closeDialog}>
        <div className="filter-form dashboard-date-form dialog-form" aria-busy={pending}>
          <div className="field-group"><label htmlFor="dashboardFrom">Từ ngày</label><Input id="dashboardFrom" name="from" type="date" value={dates.from} onChange={(event) => updateDate("from", event.target.value)} required /></div>
          <div className="field-group"><label htmlFor="dashboardTo">Đến ngày</label><Input id="dashboardTo" name="to" type="date" value={dates.to} onChange={(event) => updateDate("to", event.target.value)} required /></div>
          <div className="instant-filter-status"><span aria-live="polite">{pending ? "Đang cập nhật…" : "Kết quả cập nhật ngay"}</span><Button variant="secondary" className="secondary-button" type="button" onClick={closeDialog}>Đóng</Button></div>
        </div>
      </BottomSheet>
    </section>
  );
}

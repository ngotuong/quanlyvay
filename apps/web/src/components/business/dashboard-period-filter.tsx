"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import type { DashboardPeriod } from "@/lib/business/dashboard-period";
import { formatDate } from "@/lib/business/format";

const presetLabels: Record<DashboardPeriod["preset"], string> = {
  this_month: "Tháng này",
  previous_month: "Tháng trước",
  year_to_date: "Năm nay",
  six_months: "6 tháng",
  custom: "Tùy chỉnh",
};

function DateControl({ id, label, value, onChange }: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="dashboard-date-control" htmlFor={id}>
      <span aria-hidden="true">{formatDate(value)}</span>
      <input id={id} type="date" value={value} aria-label={label} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function DashboardPeriodFilter({ period, periodLabel }: { period: DashboardPeriod; periodLabel: string }) {
  const router = useRouter();
  const [dates, setDates] = useState({ from: period.start, to: period.end });
  const periodKey = `${period.start}:${period.end}`;
  const [syncedPeriodKey, setSyncedPeriodKey] = useState(periodKey);
  const [pending, startTransition] = useTransition();

  if (syncedPeriodKey !== periodKey) {
    setSyncedPeriodKey(periodKey);
    setDates({ from: period.start, to: period.end });
  }

  function navigate(url: string) {
    startTransition(() => router.replace(url, { scroll: false }));
  }

  function updateDate(key: "from" | "to", value: string) {
    const next = { ...dates, [key]: value };
    setDates(next);
    if (!next.from || !next.to || next.from > next.to) return;
    const params = new URLSearchParams({ from: next.from, to: next.to });
    navigate(`/dashboard?${params.toString()}`);
  }

  function updatePreset(value: DashboardPeriod["preset"]) {
    if (value === "custom") return;
    navigate(`/dashboard?preset=${value}`);
  }

  return (
    <section className="dashboard-period-bar" aria-label={`Khoảng báo cáo ${periodLabel}`} aria-busy={pending}>
      <DateControl id="dashboardFrom" label="Từ ngày" value={dates.from} onChange={(value) => updateDate("from", value)} />
      <ArrowRight className="dashboard-period-arrow" size={18} aria-hidden="true" />
      <DateControl id="dashboardTo" label="Đến ngày" value={dates.to} onChange={(value) => updateDate("to", value)} />
      <label className="dashboard-preset-control">
        <span className="sr-only">Khoảng thời gian nhanh</span>
        <span className="dashboard-preset-label" aria-hidden="true">{presetLabels[period.preset]}</span>
        <ChevronDown size={16} aria-hidden="true" />
        <select value={period.preset} aria-label="Khoảng thời gian nhanh" onChange={(event) => updatePreset(event.target.value as DashboardPeriod["preset"])}>
          {Object.entries(presetLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <span className="sr-only" aria-live="polite">{pending ? "Đang cập nhật kết quả" : ""}</span>
    </section>
  );
}

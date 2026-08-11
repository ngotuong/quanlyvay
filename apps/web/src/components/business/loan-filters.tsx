"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { LoanDirection, LoanStatus } from "@/lib/business/types";
import { LoanAdvancedFilters } from "./loan-advanced-filters";

type LoanFilterValues = {
  query: string;
  direction: LoanDirection | "";
  status: LoanStatus | "";
  disbursedFrom: string;
  disbursedTo: string;
  sort: "newest" | "oldest" | "outstanding_desc" | "name";
};

export function LoanFilters({ initial, resultCount, hasFilters }: { initial: LoanFilterValues; resultCount: number; hasFilters: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [values, setValues] = useState(initial);
  const initialKey = [initial.query, initial.direction, initial.status, initial.disbursedFrom, initial.disbursedTo, initial.sort].join("\u0000");
  const [syncedInitialKey, setSyncedInitialKey] = useState(initialKey);
  const [pending, startTransition] = useTransition();

  if (syncedInitialKey !== initialKey) {
    setSyncedInitialKey(initialKey);
    setValues(initial);
  }

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function navigate(next: LoanFilterValues, delay = 0) {
    if (timerRef.current) clearTimeout(timerRef.current);
    const run = () => {
      const params = new URLSearchParams();
      if (next.query.trim()) params.set("q", next.query.trim());
      if (next.direction) params.set("direction", next.direction);
      if (next.status) params.set("status", next.status);
      if (next.disbursedFrom) params.set("from", next.disbursedFrom);
      if (next.disbursedTo) params.set("to", next.disbursedTo);
      if (next.sort !== "newest") params.set("sort", next.sort);
      const queryString = params.toString();
      startTransition(() => router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false }));
    };
    if (delay) timerRef.current = setTimeout(run, delay);
    else run();
  }

  function update(patch: Partial<LoanFilterValues>, delay = 0) {
    const next = { ...values, ...patch };
    setValues(next);
    navigate(next, delay);
  }

  return <section className="management-filters loan-filters" aria-labelledby="loan-filter-title" aria-busy={pending}>
    <div className="filter-heading"><div><h2 id="loan-filter-title"><SlidersHorizontal size={18} /> Tìm và lọc</h2></div>{hasFilters ? <Link className="clear-filter-link" href="/loans"><X size={17} /> Xóa tất cả</Link> : null}</div>
    <div className="filter-form loan-filter-form">
      <div className="loan-filter-primary">
        <div className="field-group filter-search"><label className="sr-only" htmlFor="loanSearch">Tên khoản vay hoặc đối tác</label><span className="input-with-icon"><Search size={18} aria-hidden="true" /><input id="loanSearch" name="q" type="search" value={values.query} onChange={(event) => update({ query: event.target.value }, 300)} placeholder="Tìm tên khoản vay hoặc đối tác..." /></span></div>
        <div className="field-group"><label className="sr-only" htmlFor="loanDirection">Hướng</label><select id="loanDirection" name="direction" value={values.direction} onChange={(event) => update({ direction: event.target.value as LoanFilterValues["direction"] })}><option value="">Hướng: Tất cả</option><option value="LENDING">Cho vay</option><option value="BORROWING">Đi vay</option></select></div>
        <div className="field-group"><label className="sr-only" htmlFor="loanStatus">Trạng thái</label><select id="loanStatus" name="status" value={values.status} onChange={(event) => update({ status: event.target.value as LoanFilterValues["status"] })}><option value="">Trạng thái: Tất cả</option><option value="ACTIVE">Đang hoạt động</option><option value="BAD_DEBT">Nợ xấu</option><option value="OVERDUE">Quá hạn</option><option value="SETTLED">Đã tất toán</option></select></div>
      </div>
      <div className="filter-actions"><span aria-live="polite">{pending ? "Đang cập nhật…" : `${resultCount} kết quả`}</span><div><LoanAdvancedFilters disbursedFrom={values.disbursedFrom} disbursedTo={values.disbursedTo} sort={values.sort} active={Boolean(values.disbursedFrom || values.disbursedTo || values.sort !== "newest")} onChange={update} /></div></div>
    </div>
  </section>;
}

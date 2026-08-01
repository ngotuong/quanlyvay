import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Landmark, Percent, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { LoanActions } from "@/components/business/loan-actions";
import { LoanForm } from "@/components/business/loan-form";
import { ReversalForm } from "@/components/business/reversal-form";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate, formatRate, formatVnd } from "@/lib/business/format";
import { getLoanWorkspace, listCounterparties } from "@/lib/business/queries";
import type { LoanStatus } from "@/lib/business/types";

const statusLabels: Record<LoanStatus, string> = { ACTIVE: "Đang hoạt động", OVERDUE: "Quá hạn", BAD_DEBT: "Nợ xấu", SETTLED: "Đã tất toán" };
const transactionLabels = { DISBURSEMENT: "Giải ngân", INTEREST_PAYMENT: "Thanh toán lãi", PRINCIPAL_PAYMENT: "Thanh toán gốc", EXPENSE: "Chi phí", REVERSAL: "Đảo giao dịch" } as const;
const eventLabels = { RATE_CHANGE: "Đổi lãi suất", BAD_DEBT_START: "Chuyển nợ xấu", INTEREST_RESUME: "Bật lại tính lãi", SETTLEMENT: "Tất toán" } as const;

export default async function LoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireAuthenticatedProfile();
  const { id } = await params;
  const [{ loan, transactions, events, periods }, counterparties] = await Promise.all([getLoanWorkspace(id), listCounterparties()]);
  const calculation = loan.calculation!;
  const status = calculation.status;
  const canWrite = profile.role !== "VIEWER";
  const reversedIds = new Set(transactions.filter((item) => item.type === "REVERSAL").map((item) => item.reversal_of_id));
  const timeline = [
    ...transactions.map((item) => ({ kind: "transaction" as const, date: item.transaction_date, createdAt: item.created_at, item })),
    ...events.map((item) => ({ kind: "event" as const, date: item.effective_date, createdAt: item.created_at, item })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  return (
    <AppShell profile={profile}>
      <Link className="back-link" href="/"><ArrowLeft size={18} />Quay lại danh sách</Link>
      <div className="loan-detail-heading">
        <div><div className="heading-badges"><span className="direction-badge" data-direction={loan.direction}>{loan.direction === "LENDING" ? "Cho vay" : "Đi vay"}</span><span className="status-badge" data-status={status}>{statusLabels[status]}</span></div><h1>{loan.name}</h1><p>{loan.counterparties?.name} · Giải ngân {formatDate(loan.disbursement_date)}</p></div>
      </div>

      <section className="metric-grid" aria-label="Số liệu khoản vay">
        <article className="metric-card"><span><WalletCards size={20} /></span><div><p>Dư nợ gốc</p><strong>{formatVnd(calculation.principalOutstandingVnd)}</strong></div></article>
        <article className="metric-card"><span><Percent size={20} /></span><div><p>Lãi còn phải trả/thu</p><strong>{formatVnd(calculation.interestBalanceVnd)}</strong></div></article>
        <article className="metric-card"><span><CalendarDays size={20} /></span><div><p>Ngày đáo hạn</p><strong>{formatDate(loan.maturity_date)}</strong></div></article>
        <article className="metric-card"><span><Landmark size={20} /></span><div><p>Lãi suất ban đầu</p><strong>{formatRate(loan.initial_daily_rate_percent)}</strong></div></article>
      </section>

      {canWrite ? <LoanActions loanId={loan.id} status={status} keys={{ payment: randomUUID(), expense: randomUUID(), lifecycle: randomUUID(), settlement: randomUUID() }} /> : <div className="viewer-notice">Bạn đang ở chế độ chỉ xem. Mọi dữ liệu nghiệp vụ được giữ nguyên.</div>}

      <div className="detail-grid">
        <section className="surface-card detail-section">
          <div className="section-heading"><div><p className="eyebrow">Dòng thời gian</p><h2>Giao dịch và trạng thái</h2></div></div>
          {timeline.length === 0 ? <p className="empty-copy">Chưa có sự kiện.</p> : <div className="timeline-list compact-timeline">{timeline.map((entry) => entry.kind === "transaction" ? (
            <article className="timeline-item" key={`t-${entry.item.id}`}><span className="timeline-dot" data-transaction={entry.item.type} /><div><div className="timeline-heading"><strong>{transactionLabels[entry.item.type]}</strong><time>{formatDate(entry.item.transaction_date)}</time></div><p className="timeline-amount">{formatVnd(entry.item.amount_vnd)}{entry.item.expenses?.[0]?.category ? ` · ${entry.item.expenses[0].category}` : ""}</p>{entry.item.note ? <p>{entry.item.note}</p> : null}{canWrite && entry.item.type !== "DISBURSEMENT" && entry.item.type !== "REVERSAL" && !reversedIds.has(entry.item.id) && status !== "SETTLED" ? <ReversalForm loanId={loan.id} transactionId={entry.item.id} idempotencyKey={randomUUID()} /> : null}</div></article>
          ) : (
            <article className="timeline-item" key={`e-${entry.item.id}`}><span className="timeline-dot" data-event={entry.item.event_type} /><div><div className="timeline-heading"><strong>{eventLabels[entry.item.event_type]}</strong><time>{formatDate(entry.item.effective_date)}</time></div>{entry.item.daily_rate_percent !== null ? <p>{formatRate(entry.item.daily_rate_percent)}</p> : null}{entry.item.note ? <p>{entry.item.note}</p> : null}</div></article>
          ))}</div>}
        </section>

        <section className="surface-card detail-section">
          <div className="section-heading"><div><p className="eyebrow">Đối chiếu lãi</p><h2>Các kỳ lãi</h2></div></div>
          {periods.length === 0 ? <p className="empty-copy">Chưa phát sinh kỳ lãi.</p> : <div className="period-list">{periods.map((period) => <article key={period.id}><div><strong>{formatDate(period.start_date)} – {formatDate(period.end_date)}</strong><span>{period.day_count} ngày · {period.kind === "OVERDUE" ? "Quá hạn" : period.kind === "SETTLEMENT" ? "Tất toán" : "Định kỳ"}</span></div><dl><div><dt>Lãi phát sinh</dt><dd>{formatVnd(period.accrued_interest_vnd)}</dd></div><div><dt>Đã thanh toán</dt><dd>{formatVnd(period.interest_payments_vnd)}</dd></div><div><dt>Số dư lãi</dt><dd>{formatVnd(period.closing_interest_balance_vnd)}</dd></div></dl></article>)}</div>}
        </section>
      </div>

      <section className="surface-card detail-section loan-settings">
        <details><summary>Thông tin và ghi chú khoản vay</summary><dl className="loan-terms"><div><dt>Gốc ban đầu</dt><dd>{formatVnd(loan.original_principal_vnd)}</dd></div><div><dt>Kỳ hạn</dt><dd>{loan.term_days} ngày</dd></div><div><dt>Chu kỳ lãi</dt><dd>{loan.interest_cycle_days} ngày</dd></div><div><dt>Ghi chú</dt><dd>{loan.notes || "—"}</dd></div></dl>{canWrite ? <LoanForm counterparties={counterparties} idempotencyKey={randomUUID()} loan={loan} /> : null}</details>
      </section>
    </AppShell>
  );
}

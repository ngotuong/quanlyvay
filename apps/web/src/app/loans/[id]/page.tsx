import { NameDisclosure } from "@/components/business/name-disclosure";
import { Pagination, parsePage } from "@/components/business/pagination";
import { RenderRevision } from "@/components/app/render-revision";
import { PrivacyAmount, PrivacyRegion, PrivacyForm } from "@/components/app/privacy-provider";
import { randomUUID } from "node:crypto";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CircleDollarSign, Landmark, Percent, WalletCards } from "lucide-react";
import { LoanActions } from "@/components/business/loan-actions";
import { LoanCorrectionForm } from "@/components/business/loan-correction-form";
import { LoanForm } from "@/components/business/loan-form";
import { LegacyOnboardingForm } from "@/components/business/legacy-onboarding-form";
import { PeriodInterestPaymentForm } from "@/components/business/period-interest-payment-form";
import { ReversalForm } from "@/components/business/reversal-form";
import { SettlementReversalForm } from "@/components/business/settlement-reversal-form";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate, formatPercent, formatPeriodRate, formatVnd } from "@/lib/business/format";
import { barPercentage } from "@/lib/business/percentage.mjs";
import { getLoanWorkspace, listCounterparties } from "@/lib/business/queries";
import type { InterestPeriod, LoanStatus } from "@/lib/business/types";
import { Badge, Card, TabList, Tabs } from "@/components/ui";

const statusLabels: Record<LoanStatus, string> = { ACTIVE: "Đang hoạt động", OVERDUE: "Quá hạn", BAD_DEBT: "Nợ xấu", SETTLED: "Đã tất toán" };
const transactionLabels = { DISBURSEMENT: "Giải ngân", INTEREST_PAYMENT: "Thanh toán lãi", PRINCIPAL_PAYMENT: "Thanh toán gốc", EXPENSE: "Chi phí", REVERSAL: "Đảo giao dịch" } as const;
const eventLabels = { RATE_CHANGE: "Đổi lãi suất", BAD_DEBT_START: "Chuyển nợ xấu", INTEREST_RESUME: "Bật lại tính lãi", SETTLEMENT: "Tất toán" } as const;
const tabs = [
  { id: "overview", label: "Tổng quan" },
  { id: "interest", label: "Các kỳ lãi" },
  { id: "history", label: "Lịch sử" },
  { id: "settings", label: "Thiết lập" },
] as const;
type LoanTab = typeof tabs[number]["id"];

function subtractDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() - days);
  return value.toISOString().slice(0, 10);
}

function PeriodInterestChart({ periods }: { periods: InterestPeriod[] }) {
  const rows = periods.slice(0, 12).reverse();
  const maximum = rows.reduce((current, period) => {
    const accrued = BigInt(period.accrued_interest_vnd);
    const paid = BigInt(period.interest_payments_vnd);
    const remaining = BigInt(period.closing_interest_balance_vnd);
    const rowMaximum = accrued > paid ? (accrued > remaining ? accrued : remaining) : (paid > remaining ? paid : remaining);
    return rowMaximum > current ? rowMaximum : current;
  }, BigInt(0));
  const height = (value: string) => barPercentage(value, maximum);

  return (
    <Card className="surface-card period-chart-card" aria-labelledby="period-chart-title">
      <div className="dashboard-section-heading">
        <div><p className="eyebrow">Tối đa 12 kỳ gần nhất</p><h2 id="period-chart-title">Phát sinh, đã đóng và còn thiếu</h2></div>
        <div className="chart-legend"><span data-series="accrued">Phát sinh</span><span data-series="paid">Đã đóng</span><span data-series="remaining">Còn thiếu</span></div>
      </div>
      {rows.length === 0 ? <p className="dashboard-empty">Chưa phát sinh kỳ lãi.</p> : rows.length < 3 ? <div className="period-summary-bar" role="group" aria-label="Tóm tắt kỳ lãi gần nhất">
        <div><small>Lãi phát sinh</small><strong><PrivacyAmount value={formatVnd(rows.at(-1)!.accrued_interest_vnd)} /></strong></div>
        <div><small>Đã đóng</small><strong><PrivacyAmount value={formatVnd(rows.at(-1)!.interest_payments_vnd)} /></strong></div>
        <div><small>Còn lại</small><strong><PrivacyAmount value={formatVnd(rows.at(-1)!.closing_interest_balance_vnd)} /></strong></div>
      </div> : <div className="period-chart-scroll"><div className="period-chart" style={{ "--period-count": rows.length } as CSSProperties} role="img" aria-label="Biểu đồ đối chiếu lãi theo kỳ">
        {rows.map((period) => <div className="period-chart-column" key={period.id}>
          <div className="period-bar-group">
            <span data-series="accrued" data-zero={BigInt(period.accrued_interest_vnd) === BigInt(0)} style={{ "--bar-size": height(period.accrued_interest_vnd) } as CSSProperties} title={`Phát sinh: ${formatVnd(period.accrued_interest_vnd)}`} />
            <span data-series="paid" data-zero={BigInt(period.interest_payments_vnd) === BigInt(0)} style={{ "--bar-size": height(period.interest_payments_vnd) } as CSSProperties} title={`Đã đóng: ${formatVnd(period.interest_payments_vnd)}`} />
            <span data-series="remaining" data-zero={BigInt(period.closing_interest_balance_vnd) === BigInt(0)} style={{ "--bar-size": height(period.closing_interest_balance_vnd) } as CSSProperties} title={`Còn thiếu: ${formatVnd(period.closing_interest_balance_vnd)}`} />
          </div>
          <small>{formatDate(period.end_date)}</small>
        </div>)}
      </div></div>}
    </Card>
  );
}

export default async function LoanDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; returnTo?: string; page?: string; transaction?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const page = parsePage(query.page);
  const activeTab: LoanTab = tabs.some((tab) => tab.id === query.tab) ? query.tab as LoanTab : "overview";
  const returnTo = query.returnTo?.startsWith("/loans") && !query.returnTo.startsWith("//") ? query.returnTo : "/loans";
  const profile = await requireAuthenticatedProfile();
  const [{ loan, transactions, events, settlementReversals, principalRestructures, periods, onboarding, termSummary, schedule, managementSummary }, counterparties] = await Promise.all([
    getLoanWorkspace(id, activeTab),
    activeTab === "settings" ? listCounterparties() : Promise.resolve([]),
  ]);
  const calculation = loan.calculation!;
  const status = calculation.status;
  const canWrite = profile.role !== "VIEWER";
  const reversedIds = new Set(transactions.filter((item) => item.type === "REVERSAL").map((item) => item.reversal_of_id));
  const settlementComponentKeys = new Set(events.filter((item) => item.event_type === "SETTLEMENT" && item.idempotency_key?.endsWith(":event")).flatMap((item) => {
    const baseKey = item.idempotency_key!.slice(0, -":event".length);
    return [`${baseKey}:principal`, `${baseKey}:interest`];
  }));
  const onboardingComponentKeys = new Set(onboarding ? [`${onboarding.idempotency_key}:principal`, `${onboarding.idempotency_key}:interest`] : []);
  const restructureComponentIds = new Set(principalRestructures.flatMap((item) => [item.principal_transaction_id, item.interest_transaction_id].filter((id): id is string => Boolean(id))));
  const canOnboardLegacy = !onboarding && events.length === 0 && transactions.every((item) => item.type === "DISBURSEMENT" || item.type === "REVERSAL");
  const timeline = [
    ...transactions.filter((item) => !restructureComponentIds.has(item.id)).map((item) => ({ kind: "transaction" as const, date: item.transaction_date, createdAt: item.created_at, item })),
    ...events.map((item) => ({ kind: "event" as const, date: item.effective_date, createdAt: item.created_at, item })),
    ...settlementReversals.map((item) => ({ kind: "settlementReversal" as const, date: item.reversal_date, createdAt: item.created_at, item })),
    ...principalRestructures.map((item) => ({ kind: "principalRestructure" as const, date: item.effective_date, createdAt: item.created_at, item })),
  ].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt) || b.item.id.localeCompare(a.item.id));
  const interestRecordedLabel = loan.direction === "LENDING" ? "Lãi đã thu" : "Lãi đã trả";
  const interestBalanceLabel = loan.direction === "LENDING" ? "Lãi còn phải thu" : "Lãi còn phải trả";
  const overviewSummary = managementSummary!;
  const loanSchedule = schedule!;
  const loanTerm = termSummary!;
  const counterpartyName = loan.counterparties?.name ?? "Không rõ đối tác";
  const directionLabel = loan.direction === "LENDING" ? "Cho vay" : "Đi vay";
  const hasGeneratedName = loan.name.startsWith(`${counterpartyName} · ${directionLabel} ·`);
  const displayName = hasGeneratedName ? counterpartyName : loan.name;
  const transactionContext = { name: displayName, outstandingVnd: formatVnd(calculation.principalOutstandingVnd), interestBalanceVnd: formatVnd(calculation.interestBalanceVnd) };
  const notificationInterest = query.transaction === "interest" && BigInt(calculation.interestBalanceVnd) > BigInt(0)
    ? { type: "INTEREST_PAYMENT" as const, amountVnd: calculation.interestBalanceVnd }
    : undefined;
  const tabHref = (tab: LoanTab) => {
    const tabQuery = new URLSearchParams({ tab });
    if (returnTo !== "/loans") tabQuery.set("returnTo", returnTo);
    return `/loans/${loan.id}?${tabQuery.toString()}`;
  };

  return (
    <>
      <RenderRevision />
      <Link className="back-link" href={returnTo}><ArrowLeft size={18} />Quay lại danh sách</Link>
      <div className="loan-detail-heading">
        <div><div className="heading-badges"><Badge className="direction-badge" tone={loan.direction === "LENDING" ? "lending" : "borrowing"} data-direction={loan.direction}>{directionLabel}</Badge><Badge className="status-badge" tone={status === "ACTIVE" ? "success" : status === "SETTLED" ? "neutral" : status === "OVERDUE" ? "warning" : "danger"} data-status={status}>{statusLabels[status]}</Badge></div><NameDisclosure><h1 data-disclosure-name><PrivacyRegion>{displayName}</PrivacyRegion></h1></NameDisclosure><p className="loan-heading-metadata"><span><PrivacyRegion>{counterpartyName}</PrivacyRegion></span><span aria-hidden="true"> · </span><span>Giải ngân {formatDate(loan.disbursement_date)}</span></p></div>
      </div>

      <Tabs className="loan-tabs" aria-label="Nội dung khoản vay"><TabList>{tabs.map((tab) => <Link key={tab.id} href={tabHref(tab.id)} scroll={false} data-active={activeTab === tab.id} aria-current={activeTab === tab.id ? "page" : undefined}>{tab.label}</Link>)}</TabList></Tabs>

      {activeTab === "overview" ? <>
        <section className="overview-hero" aria-label="Tình trạng khoản vay">
          <div className="overview-primary"><span><WalletCards size={22} /></span><div><p>Dư nợ gốc</p><strong className="privacy-amount"><PrivacyAmount value={formatVnd(calculation.principalOutstandingVnd)} /></strong><small><PrivacyRegion>{counterpartyName}</PrivacyRegion></small></div></div>
          <div className="overview-next"><p>{interestBalanceLabel}</p><strong className="privacy-amount"><PrivacyAmount value={formatVnd(calculation.interestBalanceVnd)} /></strong><span><CalendarDays size={16} />{loan.maturity_date ? `Đáo hạn gốc ${formatDate(loan.maturity_date)}` : `Nhắc lãi ${formatDate(loanSchedule.nextInterestDueDate)}`}</span>{!loan.maturity_date && loan.interest_reminder_offset_days > 0 ? <small>Kỳ chốt {formatDate(loanSchedule.nextInterestPeriodEndDate)}</small> : null}</div>
          <span className="status-badge overview-status" data-status={status}>{statusLabels[status]}</span>
        </section>
        {canWrite ? <PrivacyForm><LoanActions loanId={loan.id} status={status} interestCycleDays={loan.interest_cycle_days} context={transactionContext} principalOutstandingVnd={calculation.principalOutstandingVnd} keys={{ payment: randomUUID(), expense: randomUUID(), lifecycle: randomUUID(), settlement: randomUUID(), restructure: randomUUID() }} mode="payment" autoOpen={query.transaction === "1" || Boolean(notificationInterest)} initialPayment={notificationInterest} /></PrivacyForm> : <div className="viewer-notice">Bạn đang ở chế độ chỉ xem. Mọi dữ liệu nghiệp vụ được giữ nguyên.</div>}
        <section className="overview-supporting" aria-label="Số liệu bổ sung"><div><CircleDollarSign size={18} /><span><small>{interestRecordedLabel}</small><strong className="privacy-amount"><PrivacyAmount value={formatVnd(overviewSummary.interestRecordedVnd)} /></strong></span></div><div><Percent size={18} /><span><small>Tổng lãi phát sinh</small><strong className="privacy-amount"><PrivacyAmount value={formatVnd(overviewSummary.totalAccruedInterestVnd)} /></strong></span></div><div><Landmark size={18} /><span><small>Gốc đã hoàn trả</small><strong className="privacy-amount"><PrivacyAmount value={formatVnd(overviewSummary.principalRepaidVnd)} /></strong></span></div></section>
      </> : null}

      {activeTab === "interest" ? <div className="loan-tab-stack">
        <PrivacyRegion><PeriodInterestChart periods={periods} /></PrivacyRegion>
        <section className="surface-card detail-section">
          <div className="section-heading"><div><p className="eyebrow">Đối chiếu lãi</p><h2>Các kỳ lãi</h2></div></div>
          {periods.length === 0 ? <p className="empty-copy">Chưa phát sinh kỳ lãi.</p> : <div className="period-list">{periods.slice((page-1)*25, page*25).map((period) => {
            const remainingInterest = BigInt(period.closing_interest_balance_vnd);
            const reminderDate = subtractDays(period.end_date, loan.interest_reminder_offset_days);
            const defaultPaymentDate = reminderDate < period.start_date ? period.start_date : reminderDate;
            return <article key={period.id}>
              <div><strong>{formatDate(period.start_date)} – {formatDate(period.end_date)}</strong><span>{period.day_count} ngày · {period.kind === "OVERDUE" ? "Quá hạn" : period.kind === "SETTLEMENT" ? "Tất toán" : "Định kỳ"}</span></div>
              <dl><div><dt>Lãi phát sinh</dt><dd className="privacy-amount"><PrivacyAmount value={formatVnd(period.accrued_interest_vnd)} /></dd></div><div><dt>Đã thanh toán</dt><dd className="privacy-amount"><PrivacyAmount value={formatVnd(period.interest_payments_vnd)} /></dd></div><div><dt>Số dư lãi</dt><dd className="privacy-amount"><PrivacyAmount value={formatVnd(period.closing_interest_balance_vnd)} /></dd></div></dl>
              {canWrite && status !== "SETTLED" ? <PrivacyForm><PeriodInterestPaymentForm loanId={loan.id} periodId={period.id} startDate={period.start_date} endDate={period.end_date} defaultPaymentDate={defaultPaymentDate} amountVnd={remainingInterest.toString()} canPay={remainingInterest > BigInt(0)} idempotencyKey={randomUUID()} /></PrivacyForm> : remainingInterest <= BigInt(0) ? <p className="period-paid-status">Đã đóng đủ</p> : null}
            </article>;
          })}</div>}
        </section>
      </div> : null}

      {activeTab === "history" ? <section className="surface-card detail-section">
        <div className="section-heading"><div><p className="eyebrow">Dòng thời gian</p><h2>Giao dịch và trạng thái</h2></div></div>
        {timeline.length === 0 ? <p className="empty-copy">Chưa có sự kiện.</p> : <div className="timeline-list compact-timeline">{timeline.slice((page-1)*25, page*25).map((entry) => entry.kind === "transaction" ? (
          <article className="timeline-item" key={`t-${entry.item.id}`}><span className="timeline-dot" data-transaction={entry.item.type} /><div><div className="timeline-heading"><strong>{transactionLabels[entry.item.type]}</strong><time>{formatDate(entry.item.transaction_date)}</time></div><p className="timeline-amount"><PrivacyAmount value={formatVnd(entry.item.amount_vnd)} />{entry.item.expenses?.category ? <> · <PrivacyRegion>{entry.item.expenses.category}</PrivacyRegion></> : null}</p>{entry.item.note ? <PrivacyRegion><p>{entry.item.note}</p></PrivacyRegion> : null}{canWrite && entry.item.type !== "DISBURSEMENT" && entry.item.type !== "REVERSAL" && !reversedIds.has(entry.item.id) && !settlementComponentKeys.has(entry.item.idempotency_key ?? "") && !onboardingComponentKeys.has(entry.item.idempotency_key ?? "") ? <PrivacyForm><ReversalForm loanId={loan.id} transactionId={entry.item.id} idempotencyKey={randomUUID()} /></PrivacyForm> : null}</div></article>
        ) : entry.kind === "event" ? (
          <article className="timeline-item" key={`e-${entry.item.id}`}><span className="timeline-dot" data-event={entry.item.event_type} /><div><div className="timeline-heading"><strong>{eventLabels[entry.item.event_type]}</strong><time>{formatDate(entry.item.effective_date)}</time></div>{entry.item.daily_rate_percent !== null ? <p>{formatPeriodRate(entry.item.daily_rate_percent, loan.interest_cycle_days)}</p> : null}{entry.item.note ? <PrivacyRegion><p>{entry.item.note}</p></PrivacyRegion> : null}</div></article>
        ) : entry.kind === "settlementReversal" ? (
          <article className="timeline-item" key={`sr-${entry.item.id}`}><span className="timeline-dot" data-event="SETTLEMENT_REVERSAL" /><div><div className="timeline-heading"><strong>Hoàn tác tất toán</strong><time>{formatDate(entry.item.reversal_date)}</time></div><p><PrivacyRegion>{entry.item.reason}</PrivacyRegion></p></div></article>
        ) : (
          <article className="timeline-item" key={`pr-${entry.item.id}`}><span className="timeline-dot" data-event="PRINCIPAL_RESTRUCTURE" /><div><div className="timeline-heading"><strong>Giảm gốc &amp; mở kỳ mới</strong><time>{formatDate(entry.item.effective_date)}</time></div><p className="timeline-amount"><PrivacyAmount value={`${formatVnd(entry.item.principal_before_vnd)} → ${formatVnd(entry.item.principal_after_vnd)}`} /></p><p>Gốc thực trả <PrivacyAmount value={formatVnd(entry.item.principal_payment_vnd)} /> · Lãi chốt đến ngày trước <PrivacyAmount value={formatVnd(entry.item.interest_settled_vnd)} /></p>{entry.item.note ? <PrivacyRegion><p>{entry.item.note}</p></PrivacyRegion> : null}</div></article>
        ))}</div>}
      </section> : null}

      {activeTab === "settings" ? <div className="loan-tab-stack">
        <section className="surface-card detail-section loan-settings">
          <div className="settings-section-heading"><p className="eyebrow">Thông tin khoản vay</p><h2>Điều khoản hiện tại</h2><p>Xem nhanh các thông tin đang được dùng để tính lãi và theo dõi nghĩa vụ.</p></div>
          <dl className="loan-terms"><div><dt>Gốc ban đầu</dt><dd><PrivacyAmount value={formatVnd(loan.original_principal_vnd)} /></dd></div><div><dt>Thời hạn</dt><dd>{loan.term_days === null ? "Không đáo hạn" : `${loan.term_days} ngày`}</dd></div><div><dt>Chu kỳ lãi</dt><dd>{loan.interest_cycle_days} ngày</dd></div><div><dt>Nhắc thu sớm</dt><dd>{loan.interest_reminder_offset_days} ngày</dd></div><div><dt>Lãi suất mỗi kỳ</dt><dd>{formatPercent(loanTerm.periodRatePercent)}</dd></div><div><dt>Lãi kỳ đầu đủ {loanTerm.cycleDays} ngày</dt><dd><PrivacyAmount value={formatVnd(loanTerm.fullPeriodInterestVnd)} /></dd></div><div><dt>Ghi chú</dt><dd><PrivacyRegion>{loan.notes || "—"}</PrivacyRegion></dd></div></dl>
          {canWrite && status !== "SETTLED" ? <details className="settings-action-details"><summary><span>Chỉnh sửa thông tin khoản vay<small>Dùng khi điều khoản hoặc ghi chú cần được cập nhật.</small></span></summary><PrivacyForm><LoanForm counterparties={counterparties} idempotencyKey={randomUUID()} loan={loan} /></PrivacyForm></details> : null}
        </section>
        {canWrite && status !== "SETTLED" ? <section className="surface-card detail-section loan-settings settings-operations"><PrivacyForm><LoanActions loanId={loan.id} status={status} interestCycleDays={loan.interest_cycle_days} keys={{ payment: randomUUID(), expense: randomUUID(), lifecycle: randomUUID(), settlement: randomUUID(), restructure: randomUUID() }} mode="management" /></PrivacyForm></section> : !canWrite ? <div className="viewer-notice">Bạn đang ở chế độ chỉ xem. Mọi dữ liệu nghiệp vụ được giữ nguyên.</div> : null}
        {(onboarding || (canWrite && (canOnboardLegacy || status !== "SETTLED"))) ? <section className="surface-card detail-section loan-settings settings-advanced"><div className="settings-section-heading"><p className="eyebrow">Nâng cao</p><h2>Dữ liệu cũ và sửa sai</h2><p>Chỉ dùng khi nhập một khoản vay đã tồn tại từ trước hoặc cần sửa dữ liệu gốc đã ghi nhầm.</p></div>{onboarding ? <details><summary><span>Số dư mở đầu đã ghi nhận<small>Xem dữ liệu dùng để tiếp tục theo dõi khoản vay cũ.</small></span></summary><dl className="loan-terms"><div><dt>Ngày chốt</dt><dd>{formatDate(onboarding.as_of_date)}</dd></div><div><dt>Dư gốc tại ngày chốt</dt><dd><PrivacyAmount value={formatVnd(onboarding.principal_outstanding_vnd)} /></dd></div><div><dt>Tổng lãi đã thu</dt><dd><PrivacyAmount value={formatVnd(onboarding.interest_collected_vnd)} /></dd></div><div><dt>Ngày cuối cùng còn tính lãi</dt><dd>{formatDate(onboarding.bad_debt_since)}</dd></div><div><dt>Ghi chú</dt><dd><PrivacyRegion>{onboarding.note || "—"}</PrivacyRegion></dd></div></dl></details> : null}{canWrite && canOnboardLegacy && status !== "SETTLED" ? <details><summary><span>Khởi tạo số dư khoản vay cũ<small>Nhập điểm bắt đầu khi đưa một khoản vay cũ vào hệ thống.</small></span></summary><PrivacyForm><LegacyOnboardingForm loanId={loan.id} originalPrincipalVnd={loan.original_principal_vnd} idempotencyKey={randomUUID()} /></PrivacyForm></details> : null}{canWrite && status !== "SETTLED" ? <details className="correction-details"><summary><span>Sửa dữ liệu ban đầu đã nhập sai<small>Tạo bản sửa có audit; không dùng cho thay đổi phát sinh trong quá trình vay.</small></span></summary><PrivacyForm><LoanCorrectionForm loan={loan} idempotencyKey={randomUUID()} /></PrivacyForm></details> : null}</section> : null}
        {canWrite && status === "SETTLED" ? <section className="surface-card detail-section settings-danger"><div className="settings-section-heading"><p className="eyebrow">Thao tác nguy hiểm</p><h2>Hoàn tác tất toán</h2><p>Chỉ dùng khi lần tất toán trước được thực hiện nhầm. Hệ thống sẽ tạo giao dịch đảo và giữ nguyên lịch sử audit.</p></div><PrivacyForm><SettlementReversalForm loanId={loan.id} idempotencyKey={randomUUID()} /></PrivacyForm></section> : null}
      </div> : null}
      {activeTab === "history" || activeTab === "interest" ? <Pagination page={page} total={activeTab === "history" ? timeline.length : periods.length} href={tabHref(activeTab)} /> : null}
    </>
  );
}

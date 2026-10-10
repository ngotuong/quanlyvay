import { NameDisclosure } from "@/components/business/name-disclosure";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Banknote, CalendarClock, ChartSpline, CircleAlert, HandCoins, Landmark, Minus, ReceiptText, Scale, ShieldAlert, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { DashboardPeriodFilter } from "@/components/business/dashboard-period-filter";
import { AttentionItems } from "@/components/business/attention-items";
import { CashFlowBars } from "@/components/business/cash-flow-bars";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate, formatVnd } from "@/lib/business/format";
import { dashboardComparisonPeriods, dashboardReminderWindow, resolveDashboardPeriod } from "@/lib/business/dashboard-period";
import { getManagementDashboardBundle } from "@/lib/business/queries";
import type { CounterpartyExposure, DashboardCashFlow, DashboardDueLoan } from "@/lib/business/types";
import { Card } from "@/components/ui";

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `T${Number(month)}/${year}`;
}

function comparisonPeriodLabel(start: string, end: string) {
  if (start.slice(0, 7) === end.slice(0, 7)) return `${start.slice(8, 10)}–${formatDate(end)}`;
  return `${formatDate(start)}–${formatDate(end)}`;
}

function ratio(value: string, maximum: bigint) {
  if (maximum === BigInt(0)) return "0%";
  return `${Math.max(2, Number((BigInt(value) * BigInt(100)) / maximum))}%`;
}

function compactVnd(value: bigint) {
  const absolute = value < BigInt(0) ? -value : value;
  const units = [
    { size: BigInt(1_000_000_000), label: "tỷ" },
    { size: BigInt(1_000_000), label: "tr" },
    { size: BigInt(1_000), label: "nghìn" },
  ];
  const unit = units.find((candidate) => absolute >= candidate.size);
  if (!unit) return `${absolute} ₫`;
  const tenths = (absolute * BigInt(10)) / unit.size;
  const decimal = tenths % BigInt(10);
  return `${tenths / BigInt(10)}${decimal === BigInt(0) ? "" : `,${decimal}`} ${unit.label}`;
}

import { PrivacyAccessibleValue, PrivacyAmount, PrivacyRegion } from "@/components/app/privacy-provider";

function ActionHeroBanner({ upcoming, overdue, reminderWindow }: { upcoming: DashboardDueLoan[]; overdue: DashboardDueLoan[]; reminderWindow: string }) {
  const overdueCount = overdue.length;
  const upcomingCount = upcoming.length;
  const totalCount = overdueCount + upcomingCount;

  const totalOverdueVnd = overdue.reduce((sum, item) => sum + BigInt(item.principalVnd), BigInt(0)).toString();
  const lendingInterestVnd = upcoming
    .filter((item) => item.direction === "LENDING")
    .reduce((sum, item) => sum + BigInt(item.interestVnd), BigInt(0)).toString();
  const borrowingInterestVnd = upcoming
    .filter((item) => item.direction === "BORROWING")
    .reduce((sum, item) => sum + BigInt(item.interestVnd), BigInt(0)).toString();
  const lendingCount = upcoming.filter((item) => item.direction === "LENDING").length;
  const borrowingCount = upcoming.filter((item) => item.direction === "BORROWING").length;

  if (totalCount === 0) {
    return (
      <div className="action-hero-banner" data-status="clean">
        <div className="hero-banner-content">
          <span className="hero-banner-badge" data-status="clean">Lịch nhắc</span>
          <div>
            <h2>Không có gốc quá hạn hoặc lịch nhắc trong khoảng đã chọn</h2>
            <p>Lịch thu/trả lãi: {reminderWindow}.</p>
          </div>
        </div>
      </div>
    );
  }

  if (overdueCount > 0) {
    return (
      <div className="action-hero-banner" data-status="alert">
        <div className="hero-banner-content">
          <span className="hero-banner-badge" data-status="alert"><CircleAlert size={16} /> Cần xử lý gấp</span>
          <div>
            <h2>Có {overdueCount} khoản quá hạn gốc với tổng dư nợ <PrivacyAmount value={formatVnd(totalOverdueVnd)} /></h2>
            <p>Hãy kiểm tra và ghi nhận xử lý hoặc gia hạn khoản nợ để giữ tính chính xác cho số liệu.</p>
          </div>
        </div>
        <Link className="primary-button hero-banner-cta" href="/loans?status=OVERDUE">Xem khoản quá hạn</Link>
      </div>
    );
  }

  return (
    <div className="action-hero-banner" data-status="warning">
      <div className="hero-banner-content">
        <span className="hero-banner-badge" data-status="warning"><CalendarClock size={16} /> Lịch thu/trả lãi</span>
        <div>
          <h2>{upcomingCount} lịch nhắc · {reminderWindow}</h2>
          <p className="monthly-reminder-summary"><span>{lendingCount} khoản phải thu: <PrivacyAmount value={formatVnd(lendingInterestVnd)} /></span><span>{borrowingCount} khoản phải trả: <PrivacyAmount value={formatVnd(borrowingInterestVnd)} /></span></p>
        </div>
      </div>
      <a className="secondary-button hero-banner-cta active:scale-95 transition-transform cursor-pointer" href="#schedule-title">
        Xem danh sách
      </a>
    </div>
  );
}

function MetricComparison({ current, previous, comparisonLabel }: { current: string; previous: string; comparisonLabel: string }) {
  const difference = BigInt(current) - BigInt(previous);
  const Icon = difference > BigInt(0) ? TrendingUp : difference < BigInt(0) ? TrendingDown : Minus;
  const label = difference > BigInt(0) ? "Tăng" : difference < BigInt(0) ? "Giảm" : "Không đổi";
  const absolute = difference < BigInt(0) ? -difference : difference;
  const amount = formatVnd(absolute.toString());
  const accessibleLabel = `${label} ${amount} so với ${comparisonLabel}`;
  const privateLabel = `${label} so với ${comparisonLabel}; số tiền đang ẩn`;
  return <PrivacyAccessibleValue className="metric-comparison" label={accessibleLabel} privateLabel={privateLabel} data-direction={difference > BigInt(0) ? "up" : difference < BigInt(0) ? "down" : "flat"}><Icon size={14} aria-hidden="true" /><PrivacyAmount value={amount} /></PrivacyAccessibleValue>;
}

function HorizontalBarChart({ title, eyebrow, rows }: { title: string; eyebrow: string; rows: { label: string; value: string; tone: string }[] }) {
  const maximum = rows.reduce((current, row) => BigInt(row.value) > current ? BigInt(row.value) : current, BigInt(0));
  return (
    <Card className="surface-card horizontal-chart-card">
      <div className="dashboard-section-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>
      <div className="horizontal-bars" role="list">{rows.map((row) => <div className="horizontal-bar-row" role="listitem" key={row.label}>
        <div><span>{row.label}</span><strong className="privacy-amount"><PrivacyAmount value={formatVnd(row.value)} /></strong></div>
        <span className="horizontal-bar-track" aria-hidden="true"><span data-tone={row.tone} style={{ "--bar-size": ratio(row.value, maximum) } as CSSProperties} /></span>
      </div>)}</div>
    </Card>
  );
}

function CounterpartyChart({ rows }: { rows: CounterpartyExposure[] }) {
  const maximum = rows.reduce((current, row) => BigInt(row.totalVnd) > current ? BigInt(row.totalVnd) : current, BigInt(0));
  return (
    <Card className="surface-card horizontal-chart-card counterparty-chart">
      <div className="dashboard-section-heading">
        <div><p className="eyebrow">Top 10 theo dư nợ</p><h2>Mức tập trung theo đối tác</h2></div>
        <div className="chart-legend" aria-label="Chú giải"><span data-series="lending">Cho vay</span><span data-series="bad-debt">Nợ xấu</span><span data-series="borrowing">Đi vay</span></div>
      </div>
      {rows.length === 0 ? <p className="dashboard-empty">Chưa có dư nợ để hiển thị.</p> : <>
        <div className="horizontal-bars">{rows.map((row) => {
          const total = BigInt(row.totalVnd);
          const width = maximum === BigInt(0) ? BigInt(0) : (total * BigInt(10000)) / maximum;
          const segment = (value: string) => total === BigInt(0) ? "0%" : `${Number((BigInt(value) * width) / total) / 100}%`;
          return <div className="horizontal-bar-row" key={row.counterpartyId}>
            <div><span><NameDisclosure as="span"><span data-disclosure-name><PrivacyRegion>{row.name}</PrivacyRegion></span></NameDisclosure></span><strong className="privacy-amount"><PrivacyAmount value={formatVnd(row.totalVnd)} /></strong></div>
            <span className="horizontal-bar-track stacked-bar" aria-hidden="true">
              <span data-tone="lending" style={{ "--bar-size": segment(row.lendingVnd) } as CSSProperties} />
              <span data-tone="bad-debt" style={{ "--bar-size": segment(row.badDebtVnd) } as CSSProperties} />
              <span data-tone="borrowing" style={{ "--bar-size": segment(row.borrowingVnd) } as CSSProperties} />
            </span>
          </div>;
        })}</div>
        <details className="chart-data-details"><summary>Xem bảng đối tác</summary><ResponsiveTable className="dashboard-data-table"><table role="table"><thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Đối tác</th><th role="columnheader" scope="col">Cho vay</th><th role="columnheader" scope="col">Nợ xấu</th><th role="columnheader" scope="col">Đi vay</th><th role="columnheader" scope="col">Tổng</th></tr></thead><tbody role="rowgroup">{rows.map((row) => <tr role="row" key={row.counterpartyId}><th role="rowheader" scope="row"><NameDisclosure as="span"><span data-disclosure-name><PrivacyRegion>{row.name}</PrivacyRegion></span></NameDisclosure></th><td role="cell" className="privacy-amount"><span className="table-card-label" aria-hidden="true">Cho vay</span><span className="table-card-value"><PrivacyAmount value={formatVnd(row.lendingVnd)} /></span></td><td role="cell" className="privacy-amount"><span className="table-card-label" aria-hidden="true">Nợ xấu</span><span className="table-card-value"><PrivacyAmount value={formatVnd(row.badDebtVnd)} /></span></td><td role="cell" className="privacy-amount"><span className="table-card-label" aria-hidden="true">Đi vay</span><span className="table-card-value"><PrivacyAmount value={formatVnd(row.borrowingVnd)} /></span></td><td role="cell" className="privacy-amount"><span className="table-card-label" aria-hidden="true">Tổng</span><span className="table-card-value"><PrivacyAmount value={formatVnd(row.totalVnd)} /></span></td></tr>)}</tbody></table></ResponsiveTable></details>
      </>}
    </Card>
  );
}

function CashFlowChart({ rows, periodLabel }: { rows: DashboardCashFlow[]; periodLabel: string }) {
  const maximum = rows.reduce((current, row) => {
    const monthMaximum = BigInt(row.inflowVnd) > BigInt(row.outflowVnd) ? BigInt(row.inflowVnd) : BigInt(row.outflowVnd);
    return monthMaximum > current ? monthMaximum : current;
  }, BigInt(0));
  const hasCashFlow = rows.some(row => BigInt(row.inflowVnd) !== BigInt(0) || BigInt(row.outflowVnd) !== BigInt(0));

  return (
    <Card className="surface-card cash-flow-card" aria-labelledby="cash-flow-title">
      <div className="dashboard-section-heading">
        <div><p className="eyebrow">{periodLabel}</p><h2 id="cash-flow-title">Xu hướng dòng tiền</h2></div>
        <div className="chart-legend" aria-label="Chú giải"><span data-series="inflow">Tiền vào</span><span data-series="outflow">Tiền ra</span></div>
      </div>
      {hasCashFlow ? <><div className="cash-flow-plot">
        <div className="chart-y-axis" aria-hidden="true"><span><PrivacyAmount value={compactVnd(maximum)} fallback="—" /></span><span><PrivacyAmount value={compactVnd(maximum / BigInt(2))} fallback="—" /></span><span><PrivacyAmount value="0 ₫" fallback="—" /></span></div>
        <div className="cash-flow-chart-scroll">
          <CashFlowBars rows={rows} maximum={maximum.toString()} />
        </div>
      </div>
      <details className="cash-flow-details chart-data-details">
        <summary>Xem bảng số liệu</summary>
        <ResponsiveTable className="dashboard-data-table"><table role="table"><thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Tháng</th><th role="columnheader" scope="col">Tiền vào</th><th role="columnheader" scope="col">Tiền ra</th><th role="columnheader" scope="col">Ròng</th></tr></thead><tbody role="rowgroup">{rows.map((row) => <tr role="row" key={row.month}><th role="rowheader" scope="row">{monthLabel(row.month)}</th><td role="cell" className="privacy-amount"><span className="table-card-label" aria-hidden="true">Tiền vào</span><span className="table-card-value"><PrivacyAmount value={formatVnd(row.inflowVnd)} /></span></td><td role="cell" className="privacy-amount"><span className="table-card-label" aria-hidden="true">Tiền ra</span><span className="table-card-value"><PrivacyAmount value={formatVnd(row.outflowVnd)} /></span></td><td role="cell" className="privacy-amount" data-negative={BigInt(row.netVnd) < BigInt(0)}><span className="table-card-label" aria-hidden="true">Ròng</span><span className="table-card-value"><PrivacyAmount value={formatVnd(row.netVnd)} /></span></td></tr>)}</tbody></table></ResponsiveTable>
      </details></> : <div className="dashboard-empty"><strong>Chưa có dòng tiền trong kỳ</strong><span>Các khoản thu, chi sẽ xuất hiện sau khi giao dịch được ghi nhận.</span></div>}
    </Card>
  );
}

function AttentionList({ upcoming, overdue, reminderWindow }: { upcoming: DashboardDueLoan[]; overdue: DashboardDueLoan[]; reminderWindow: string }) {
  const total = overdue.length + upcoming.length;
  const interestAction = (loan: DashboardDueLoan) => loan.direction === "LENDING" ? "Cần thu lãi" : "Cần trả lãi";
  const rows = [
    ...overdue.map((loan) => ({ loan, kind: "overdue" as const })),
    ...upcoming.map((loan) => ({ loan, kind: "interest" as const })),
  ];
  return (
    <Card className="surface-card due-card attention-card" aria-labelledby="schedule-title">
      <AttentionItems heading={<div className="attention-heading-main"><div><h2 id="schedule-title">Việc cần xử lý</h2><p className="eyebrow">Gốc quá hạn và lịch nhắc</p></div><span className="count-badge" data-alert={overdue.length > 0}>{total}</span></div>}
        emptyState={<div className="dashboard-empty"><strong>Không có việc đến hạn</strong><span>Không có gốc quá hạn. Lịch thu/trả lãi: {reminderWindow}.</span></div>}
        items={rows.map(({ loan, kind }) => <NameDisclosure className="due-name-disclosure" key={`${kind}-${loan.id}`}><Link href={`/loans/${loan.id}${kind === "interest" ? "?transaction=interest" : ""}`} className="due-item">
          <span className="due-icon" data-direction={loan.direction}>{loan.direction === "LENDING" ? <HandCoins size={19} /> : <Landmark size={19} />}</span>
          <span className="due-main"><strong data-disclosure-name><PrivacyRegion>{loan.name}</PrivacyRegion></strong><small>{kind === "overdue" ? `Quá hạn gốc từ ${formatDate(loan.periodEndDate)}` : `Nhắc ${formatDate(loan.reminderDate ?? loan.dueDate)} · Kỳ chốt ${formatDate(loan.periodEndDate)}`}</small></span>
          <span className="due-value"><strong className="privacy-amount"><PrivacyAmount value={formatVnd(kind === "overdue" ? loan.principalVnd : loan.interestVnd)} /></strong><small>{loan.direction === "LENDING" ? "Cho vay" : "Đi vay"} · {kind === "overdue" ? "Dư gốc quá hạn" : interestAction(loan)}</small></span>
        </Link></NameDisclosure>)} />
    </Card>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string; preset?: string }> }) {
  await requireAuthenticatedProfile();
  const period = resolveDashboardPeriod(await searchParams);
  const comparison = dashboardComparisonPeriods(period);
  const { dashboard, analytics, previousDashboard, previousBalanceDashboard } = await getManagementDashboardBundle(
    period.start,
    period.end,
    comparison.flow.start,
    comparison.flow.end,
    comparison.balance.start,
    comparison.balance.end,
  );
  const periodLabel = `${formatDate(dashboard.periodStartDate)}–${formatDate(dashboard.periodEndDate)}`;
  const reminderDates = dashboardReminderWindow(dashboard.periodEndDate);
  const reminderWindow = `${formatDate(reminderDates.start)}–${formatDate(reminderDates.end)}`;
  const flowComparisonLabel = comparisonPeriodLabel(comparison.flow.start, comparison.flow.end);
  const balanceComparisonLabel = formatDate(comparison.balance.end);
  const primaryMetrics = [
    { label: "Cho vay đang hoạt động", value: dashboard.activeLendingOutstandingVnd, previous: previousBalanceDashboard.activeLendingOutstandingVnd, comparisonLabel: balanceComparisonLabel, icon: ArrowUpRight, tone: "lending" },
    { label: "Dư nợ đi vay", value: dashboard.activeBorrowingOutstandingVnd, previous: previousBalanceDashboard.activeBorrowingOutstandingVnd, comparisonLabel: balanceComparisonLabel, icon: ArrowDownLeft, tone: "borrowing" },
    { label: "Lãi ròng thực thu", value: dashboard.cashProfitVnd, previous: previousDashboard.cashProfitVnd, comparisonLabel: flowComparisonLabel, icon: WalletCards, tone: "profit" },
    { label: "Lãi ròng phát sinh", value: dashboard.accrualProfitVnd, previous: previousDashboard.accrualProfitVnd, comparisonLabel: flowComparisonLabel, icon: TrendingUp, tone: "accrual" },
  ];
  const riskMetrics = [
    { label: "Tổng vốn chưa thu hồi", value: dashboard.totalLendingExposureVnd, icon: Scale, tone: "exposure", hint: "Cho vay hoạt động + nợ xấu" },
    { label: "Nợ xấu phải thu", value: dashboard.badDebtLendingOutstandingVnd, icon: ShieldAlert, tone: "bad-debt", hint: "Dư gốc nợ xấu được tách riêng để theo dõi" },
  ];

  return (
    <>
      <div className="page-heading-row dashboard-heading"><div className="page-title-lockup"><span className="page-title-icon"><ChartSpline size={24} strokeWidth={1.8} /></span><div><h1>Tổng quan</h1><p className="page-description">Số dư, lãi và lịch thu/trả lãi.</p></div></div></div>

      <DashboardPeriodFilter period={period} periodLabel={periodLabel} />

      <ActionHeroBanner upcoming={dashboard.upcoming} overdue={dashboard.overdue} reminderWindow={reminderWindow} />

      <div className="dashboard-workspace">
      <section className="dashboard-metrics dashboard-primary-metrics" aria-label="Các chỉ số chính">{primaryMetrics.map(({ label, value, previous, comparisonLabel, icon: Icon, tone }) => <Card as="article" variant="metric" className="dashboard-metric" data-tone={tone} key={label}><span className="dashboard-metric-icon"><Icon size={20} /></span><div><p>{label}</p><strong className="privacy-amount"><PrivacyAmount value={formatVnd(value)} /></strong><MetricComparison current={value} previous={previous} comparisonLabel={comparisonLabel} /></div></Card>)}</section>

      <div className="dashboard-main-grid dashboard-focus-grid"><AttentionList upcoming={dashboard.upcoming} overdue={dashboard.overdue} reminderWindow={reminderWindow} /><CashFlowChart rows={dashboard.cashFlow} periodLabel={periodLabel} /></div>

      </div>
      <details className="dashboard-analysis">
        <summary><span><strong>Phân tích chi tiết</strong></span></summary>
        <div className="dashboard-analysis-content">
          <section className="dashboard-metrics dashboard-risk-metrics" aria-label="Vốn và nợ xấu">{riskMetrics.map(({ label, value, icon: Icon, tone, hint }) => <Card as="article" variant="metric" className="dashboard-metric" data-tone={tone} key={label}><span className="dashboard-metric-icon"><Icon size={20} /></span><div><p>{label}</p><strong className="privacy-amount"><PrivacyAmount value={formatVnd(value)} /></strong><small>{hint}</small>{tone === "bad-debt" ? <Link className="metric-detail-link" href="/loans?status=BAD_DEBT">Xem các khoản nợ xấu</Link> : null}</div></Card>)}</section>

          <section className="interest-strip" aria-label="Tổng hợp lãi và chi phí">
            <div><Banknote size={19} /><span><small>Lãi đã thu</small><strong className="privacy-amount"><PrivacyAmount value={formatVnd(dashboard.interestCollectedVnd)} /></strong></span></div>
            <div><Landmark size={19} /><span><small>Lãi đã trả</small><strong className="privacy-amount"><PrivacyAmount value={formatVnd(dashboard.interestPaidVnd)} /></strong></span></div>
            <div><ReceiptText size={19} /><span><small>Chi phí khác</small><strong className="privacy-amount"><PrivacyAmount value={formatVnd(dashboard.expensesPaidVnd)} /></strong></span></div>
            <div><ArrowUpRight size={19} /><span><small>Lãi cho vay kỳ tới</small><strong className="privacy-amount"><PrivacyAmount value={formatVnd(dashboard.projectedLendingInterestVnd)} /></strong></span></div>
            <div><ArrowDownLeft size={19} /><span><small>Lãi đi vay kỳ tới</small><strong className="privacy-amount"><PrivacyAmount value={formatVnd(dashboard.projectedBorrowingInterestVnd)} /></strong></span></div>
          </section>

          <div className="dashboard-analytics-grid">
            <HorizontalBarChart eyebrow={periodLabel} title="Phát sinh và thanh toán lãi" rows={[
              { label: "Lãi cho vay phát sinh", value: analytics.lendingAccruedVnd, tone: "lending" },
              { label: "Lãi đã thu", value: dashboard.interestCollectedVnd, tone: "collected" },
              { label: "Lãi đi vay phát sinh", value: analytics.borrowingAccruedVnd, tone: "borrowing" },
              { label: "Lãi đã trả", value: dashboard.interestPaidVnd, tone: "paid" },
            ]} />
            <HorizontalBarChart eyebrow={`Tại ${formatDate(dashboard.periodEndDate)}`} title="Cơ cấu dư nợ" rows={[
              { label: "Cho vay hoạt động", value: dashboard.activeLendingOutstandingVnd, tone: "lending" },
              { label: "Nợ xấu", value: dashboard.badDebtLendingOutstandingVnd, tone: "bad-debt" },
              { label: "Đi vay", value: dashboard.totalBorrowingExposureVnd, tone: "borrowing" },
            ]} />
          </div>

          <CounterpartyChart rows={analytics.counterpartyExposure} />
        </div>
      </details>
    </>
  );
}

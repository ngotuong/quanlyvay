import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Banknote, CalendarClock, CircleAlert, Landmark, ReceiptText, TrendingUp, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate, formatVnd } from "@/lib/business/format";
import { getDashboard } from "@/lib/business/queries";
import type { DashboardCashFlow, DashboardDueLoan } from "@/lib/business/types";

function monthLabel(value: string) {
  const [year, month] = value.split("-");
  return `T${Number(month)}/${year}`;
}

function ratio(value: string, maximum: bigint) {
  if (maximum === BigInt(0)) return "0%";
  return `${Math.max(2, Number((BigInt(value) * BigInt(100)) / maximum))}%`;
}

function CashFlowChart({ rows }: { rows: DashboardCashFlow[] }) {
  const maximum = rows.reduce((current, row) => {
    const monthMaximum = BigInt(row.inflowVnd) > BigInt(row.outflowVnd) ? BigInt(row.inflowVnd) : BigInt(row.outflowVnd);
    return monthMaximum > current ? monthMaximum : current;
  }, BigInt(0));

  return (
    <section className="surface-card cash-flow-card" aria-labelledby="cash-flow-title">
      <div className="dashboard-section-heading">
        <div><p className="eyebrow">6 tháng gần nhất</p><h2 id="cash-flow-title">Dòng tiền theo tháng</h2></div>
        <div className="chart-legend" aria-label="Chú giải"><span data-series="inflow">Tiền vào</span><span data-series="outflow">Tiền ra</span></div>
      </div>
      <div className="cash-flow-chart" role="img" aria-label="Biểu đồ cột so sánh tiền vào và tiền ra theo tháng">
        {rows.map((row) => (
          <div className="cash-flow-month" key={row.month}>
            <div className="bar-pair">
              <span className="cash-bar" data-series="inflow" style={{ "--bar-size": ratio(row.inflowVnd, maximum) } as CSSProperties} title={`Tiền vào ${monthLabel(row.month)}: ${formatVnd(row.inflowVnd)}`} />
              <span className="cash-bar" data-series="outflow" style={{ "--bar-size": ratio(row.outflowVnd, maximum) } as CSSProperties} title={`Tiền ra ${monthLabel(row.month)}: ${formatVnd(row.outflowVnd)}`} />
            </div>
            <span>{monthLabel(row.month)}</span>
          </div>
        ))}
      </div>
      <details className="cash-flow-details">
        <summary>Xem bảng số liệu</summary>
        <div className="table-scroll"><table><thead><tr><th>Tháng</th><th>Tiền vào</th><th>Tiền ra</th><th>Ròng</th></tr></thead><tbody>{rows.map((row) => <tr key={row.month}><th>{monthLabel(row.month)}</th><td>{formatVnd(row.inflowVnd)}</td><td>{formatVnd(row.outflowVnd)}</td><td data-negative={BigInt(row.netVnd) < BigInt(0)}>{formatVnd(row.netVnd)}</td></tr>)}</tbody></table></div>
      </details>
    </section>
  );
}

function DueList({ title, eyebrow, loans, overdue = false }: { title: string; eyebrow: string; loans: DashboardDueLoan[]; overdue?: boolean }) {
  return (
    <section className="surface-card due-card" aria-labelledby={overdue ? "overdue-title" : "upcoming-title"}>
      <div className="dashboard-section-heading"><div><p className="eyebrow">{eyebrow}</p><h2 id={overdue ? "overdue-title" : "upcoming-title"}>{title}</h2></div><span className="count-badge" data-alert={overdue}>{loans.length}</span></div>
      {loans.length === 0 ? <p className="dashboard-empty">Không có khoản nào trong nhóm này.</p> : (
        <div className="due-list">{loans.map((loan) => <Link href={`/loans/${loan.id}`} className="due-item" key={loan.id}>
          <span className="due-icon" data-overdue={overdue}>{overdue ? <CircleAlert size={19} /> : <CalendarClock size={19} />}</span>
          <span className="due-main"><strong>{loan.name}</strong><small>{loan.direction === "LENDING" ? "Cho vay" : "Đi vay"} · {overdue ? "Đáo hạn" : "Đóng lãi"} {formatDate(loan.dueDate)}</small></span>
          <span className="due-value"><strong>{formatVnd(loan.principalVnd)}</strong><small>Lãi {formatVnd(loan.interestVnd)}</small></span>
        </Link>)}</div>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const profile = await requireAuthenticatedProfile();
  const dashboard = await getDashboard();
  const metrics = [
    { label: "Dư nợ cho vay", value: dashboard.lendingOutstandingVnd, icon: ArrowUpRight, tone: "lending" },
    { label: "Dư nợ đi vay", value: dashboard.borrowingOutstandingVnd, icon: ArrowDownLeft, tone: "borrowing" },
    { label: "Lợi nhuận tiền mặt", value: dashboard.cashProfitVnd, icon: WalletCards, tone: "profit", hint: "Lãi đã thu − lãi đã trả − chi phí" },
    { label: "Lợi nhuận dồn tích", value: dashboard.accrualProfitVnd, icon: TrendingUp, tone: "accrual", hint: "Lãi phát sinh cho vay − đi vay − chi phí" },
  ];

  return (
    <AppShell profile={profile}>
      <div className="page-heading-row dashboard-heading"><div><p className="eyebrow">Tổng quan tài chính</p><h1>Dashboard</h1><p className="page-description">Số liệu đến ngày {formatDate(dashboard.asOfDate)}, tính trực tiếp từ sổ giao dịch.</p></div></div>

      <section className="dashboard-metrics" aria-label="Các chỉ số chính">{metrics.map(({ label, value, icon: Icon, tone, hint }) => <article className="dashboard-metric" data-tone={tone} key={label}><span className="dashboard-metric-icon"><Icon size={20} /></span><div><p>{label}</p><strong>{formatVnd(value)}</strong>{hint ? <small>{hint}</small> : null}</div></article>)}</section>

      <section className="interest-strip" aria-label="Tổng hợp lãi và chi phí">
        <div><Banknote size={19} /><span><small>Lãi đã thu</small><strong>{formatVnd(dashboard.interestCollectedVnd)}</strong></span></div>
        <div><Landmark size={19} /><span><small>Lãi đã trả</small><strong>{formatVnd(dashboard.interestPaidVnd)}</strong></span></div>
        <div><ReceiptText size={19} /><span><small>Chi phí khác</small><strong>{formatVnd(dashboard.expensesPaidVnd)}</strong></span></div>
        <div><ArrowUpRight size={19} /><span><small>Lãi cho vay dự kiến kỳ tới</small><strong>{formatVnd(dashboard.projectedLendingInterestVnd)}</strong></span></div>
        <div><ArrowDownLeft size={19} /><span><small>Lãi đi vay dự kiến kỳ tới</small><strong>{formatVnd(dashboard.projectedBorrowingInterestVnd)}</strong></span></div>
      </section>

      <div className="dashboard-main-grid"><CashFlowChart rows={dashboard.cashFlow} /><div className="due-column"><DueList eyebrow="Trong 30 ngày" title="Sắp đến hạn" loans={dashboard.upcoming} /><DueList eyebrow="Cần theo dõi" title="Đã quá hạn" loans={dashboard.overdue} overdue /></div></div>
    </AppShell>
  );
}

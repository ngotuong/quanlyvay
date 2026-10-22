import { ArrowLeftRight, BellDot, ChartSpline, ContactRound, ScrollText, SlidersHorizontal, WalletCards } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type Screen = "dashboard" | "loans" | "loan" | "new-loan" | "counterparties" | "expenses" | "notifications" | "audit" | "settings" | "generic";
const screens = {
  dashboard: { title: "Tổng quan", description: "Số dư, lãi và lịch thu/trả lãi.", icon: ChartSpline },
  loans: { title: "Các khoản vay", description: "Tìm theo đối tác, trạng thái hoặc thời điểm giải ngân.", icon: ArrowLeftRight },
  counterparties: { title: "Đối tác", description: "Tìm liên hệ trước, chỉ mở biểu mẫu khi cần thêm hoặc sửa.", icon: ContactRound },
  expenses: { title: "Chi phí chung", icon: WalletCards },
  notifications: { title: "Thông báo", icon: BellDot },
  audit: { title: "Nhật ký hệ thống", icon: ScrollText },
  settings: { title: "Cài đặt", icon: SlidersHorizontal },
} as const;
function Lines() { return <><Skeleton className="loading-line" /><Skeleton className="loading-line loading-line-short" /></>; }
function Rows({ kind = "list" }: { kind?: "list" | "table" | "timeline" }) {
  return <div className={`loading-rows loading-rows-${kind}`}>{Array.from({ length: 3 }, (_, i) => <div className="loading-row" key={i}><Skeleton className="loading-icon" /><div><Lines /></div>{kind === "table" ? <Skeleton className="loading-line" /> : null}</div>)}</div>;
}
function LoanRows() {
  return <div className="loading-loan-list">{Array.from({length:3},(_,i)=><div className="loading-loan-card" key={i}><Skeleton className="loading-icon" /><div className="loading-loan-identity"><div className="loading-loan-title-row"><Skeleton className="loading-line" /><div className="loading-loan-tags"><Skeleton className="loading-line loading-line-short" /><Skeleton className="loading-line loading-line-short" /></div></div><Skeleton className="loading-line loading-line-short" /><div className="loading-loan-metadata"><Lines /><Skeleton className="loading-line" /></div></div><div className="loading-loan-values">{[0,1,2].map(n=><div key={n}><Skeleton className="loading-line loading-line-short" /><Skeleton className="loading-value" /></div>)}</div><Skeleton className="loading-control loading-loan-action" /></div>)}</div>;
}
export function RouteLoading({ screen = "generic" }: { screen?: Screen }) {
  const config = screen in screens ? screens[screen as keyof typeof screens] : null;
  const title = config?.title ?? (screen === "loan" ? "khoản vay" : screen === "new-loan" ? "biểu mẫu khoản vay" : "nội dung");
  return <div className="content-loading route-loading" data-loading-route={screen} role="status" aria-busy="true" aria-label={`Đang tải ${title}`}>
    <span className="sr-only">Đang tải {title}…</span>
    <div aria-hidden="true">
      {config ? <div className={`page-heading-row ${screen === "dashboard" ? "dashboard-heading" : screen === "loans" ? "loans-heading" : ""}`}><div className="page-title-lockup"><span className="page-title-icon"><config.icon size={24} strokeWidth={1.8} /></span><div><h1>{config.title}</h1>{"description" in config ? <p className="page-description">{config.description}</p> : null}</div></div>{["loans","counterparties","expenses","notifications"].includes(screen) ? <Skeleton className={`loading-heading-action ${screen === "loans" ? "loan-create-link" : ""}`} /> : null}</div> : screen === "loan" || screen === "new-loan" ? <><Skeleton className="loading-back" />{screen === "loan" ? <div className="loading-detail-heading"><Lines /></div> : <div className="page-heading-row"><div className="mobile-repeated-title"><h1>Tạo khoản vay</h1></div></div>}</> : <Skeleton className="loading-page-title" />}
      {screen === "dashboard" ? <>
        <div className="loading-period"><Lines /><Skeleton className="loading-control" /></div>
        <div className="loading-banner"><Lines /></div>
        <div className="dashboard-workspace"><section className="dashboard-metrics loading-metrics">{Array.from({ length: 4 }, (_, i) => <div className="dashboard-metric" key={i}><Skeleton className="dashboard-metric-icon" /><div><Lines /><Skeleton className="loading-line loading-value" /></div></div>)}</section>
          <div className="dashboard-main-grid loading-focus-grid"><section className="surface-card loading-task"><Lines /><Rows /></section><section className="surface-card loading-chart"><Lines /><div className="loading-chart-bars">{[40,70,55,90,65,45].map((height,i)=><Skeleton className={`loading-bar loading-bar-${height}`} key={i} />)}</div><Skeleton className="loading-disclosure" /></section></div>
        </div>
      </> : screen === "loan" ? <><Skeleton className="loading-tabs" /><section className="loading-overview"><Skeleton className="loading-icon" /><div><Lines /><Skeleton className="loading-value" /></div><Lines /></section><div className="loading-actions loading-loan-actions"><Skeleton className="loading-control" /><Skeleton className="loading-control" /></div><Rows kind="table" /></>
        : screen === "new-loan" ? <section className="surface-card form-surface loading-form">{Array.from({length:8},(_,i)=><div key={i}><Skeleton className="loading-line loading-line-short" /><Skeleton className="loading-control" /></div>)}</section>
        : screen === "settings" ? <><section className="surface-card loading-settings"><Lines /><div className="loading-actions"><Skeleton className="loading-control" /><Skeleton className="loading-control" /><Skeleton className="loading-control" /></div></section><section className="surface-card loading-settings"><Lines /><div className="loading-actions"><Skeleton className="loading-control" /><Skeleton className="loading-control" /></div></section><Rows /></>
        : <>{["loans","counterparties","notifications"].includes(screen) ? <div className={`loading-filters loading-filters-${screen}`}><Skeleton className="loading-control" />{screen === "loans" ? <><Skeleton className="loading-control" /><Skeleton className="loading-control" /><Skeleton className="loading-filter-actions" /></> : null}</div> : null}{screen === "loans" ? <LoanRows /> : <Rows kind={screen === "audit" ? "timeline" : "list"} />}</>}
    </div>
  </div>;
}

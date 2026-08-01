import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, CircleAlert, Plus } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate, formatVnd } from "@/lib/business/format";
import { listLoans } from "@/lib/business/queries";
import type { LoanStatus } from "@/lib/business/types";

const statusLabels: Record<LoanStatus, string> = { ACTIVE: "Đang hoạt động", OVERDUE: "Quá hạn", BAD_DEBT: "Nợ xấu", SETTLED: "Đã tất toán" };

export default async function LoansPage() {
  const profile = await requireAuthenticatedProfile();
  const loans = await listLoans();

  return (
    <AppShell profile={profile} showCreateLoan>
      <div className="page-heading-row">
        <div><p className="eyebrow">Danh mục tài chính</p><h1>Các khoản vay</h1><p className="page-description">Theo dõi cả khoản cho vay và khoản bạn đang đi vay.</p></div>
        {profile.role !== "VIEWER" ? <Link className="primary-link desktop-only" href="/loans/new"><Plus size={18} />Tạo khoản vay</Link> : null}
      </div>

      <div className="filter-pills" aria-label="Tóm tắt danh sách">
        <span>{loans.length} khoản</span>
        <span>{loans.filter((loan) => loan.direction === "LENDING").length} cho vay</span>
        <span>{loans.filter((loan) => loan.direction === "BORROWING").length} đi vay</span>
      </div>

      {loans.length === 0 ? (
        <section className="empty-state">
          <span className="empty-icon"><CircleAlert size={28} /></span>
          <h2>Chưa có khoản vay</h2>
          <p>Hãy thêm đối tác trước, sau đó tạo khoản vay đầu tiên.</p>
          {profile.role !== "VIEWER" ? <div className="empty-actions"><Link className="secondary-link" href="/counterparties">Thêm đối tác</Link><Link className="primary-link" href="/loans/new">Tạo khoản vay</Link></div> : null}
        </section>
      ) : (
        <section className="loan-list" aria-label="Danh sách khoản vay">
          {loans.map((loan) => {
            const status = loan.calculation?.status ?? loan.status;
            return (
              <Link className="loan-card" href={`/loans/${loan.id}`} key={loan.id}>
                <div className="loan-card-icon" data-direction={loan.direction}>{loan.direction === "LENDING" ? <ArrowUpRight /> : <ArrowDownLeft />}</div>
                <div className="loan-card-main"><div className="loan-card-title"><h2>{loan.name}</h2><span className="status-badge" data-status={status}>{statusLabels[status]}</span></div><p>{loan.counterparties?.name ?? "Không rõ đối tác"} · Đáo hạn {formatDate(loan.maturity_date)}</p></div>
                <dl className="loan-card-values"><div><dt>Dư nợ</dt><dd>{formatVnd(loan.calculation?.principalOutstandingVnd ?? loan.original_principal_vnd)}</dd></div><div><dt>Lãi còn lại</dt><dd>{formatVnd(loan.calculation?.interestBalanceVnd)}</dd></div></dl>
              </Link>
            );
          })}
        </section>
      )}
    </AppShell>
  );
}

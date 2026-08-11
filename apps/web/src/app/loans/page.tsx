import Link from "next/link";
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight, CircleAlert, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { LoanAdvancedFilters } from "@/components/business/loan-advanced-filters";
import { isValidBusinessDate } from "@/lib/business/dashboard-period";
import { formatDate, formatVnd } from "@/lib/business/format";
import { listLoans } from "@/lib/business/queries";
import type { LoanListFilters } from "@/lib/business/queries";
import type { LoanDirection, LoanStatus } from "@/lib/business/types";

const statusLabels: Record<LoanStatus, string> = { ACTIVE: "Đang hoạt động", OVERDUE: "Quá hạn", BAD_DEBT: "Nợ xấu", SETTLED: "Đã tất toán" };

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = await requireAuthenticatedProfile();
  const params = await searchParams;
  const query = single(params.q)?.trim().slice(0, 120) ?? "";
  const rawDirection = single(params.direction);
  const direction = rawDirection === "LENDING" || rawDirection === "BORROWING" ? rawDirection as LoanDirection : undefined;
  const rawStatus = single(params.status);
  const status = rawStatus && rawStatus in statusLabels ? rawStatus as LoanStatus : undefined;
  const rawDisbursedFrom = single(params.from);
  const rawDisbursedTo = single(params.to);
  const disbursedFrom = isValidBusinessDate(rawDisbursedFrom) ? rawDisbursedFrom : undefined;
  const disbursedTo = isValidBusinessDate(rawDisbursedTo) ? rawDisbursedTo : undefined;
  const rawSort = single(params.sort);
  const sort: NonNullable<LoanListFilters["sort"]> = rawSort === "oldest" || rawSort === "outstanding_desc" || rawSort === "name" ? rawSort : "newest";
  const hasFilters = Boolean(query || direction || status || disbursedFrom || disbursedTo || sort !== "newest");
  const loanResult = await listLoans({ query, direction, status, disbursedFrom, disbursedTo, sort });
  const loans = loanResult.items;
  const currentQuery = new URLSearchParams();
  if (query) currentQuery.set("q", query);
  if (direction) currentQuery.set("direction", direction);
  if (status) currentQuery.set("status", status);
  if (disbursedFrom) currentQuery.set("from", disbursedFrom);
  if (disbursedTo) currentQuery.set("to", disbursedTo);
  if (sort !== "newest") currentQuery.set("sort", sort);
  const returnTo = currentQuery.size ? `/loans?${currentQuery.toString()}` : "/loans";
  const withoutFilter = (key: string) => {
    const url = new URLSearchParams(currentQuery);
    url.delete(key);
    const queryString = url.toString();
    return queryString ? `/loans?${queryString}` : "/loans";
  };

  return (
    <>
      <div className="page-heading-row">
        <div className="page-title-lockup"><span className="page-title-icon"><ArrowLeftRight size={24} strokeWidth={1.8} /></span><div><h1>Các khoản vay</h1></div></div>
        {profile.role !== "VIEWER" ? <Link className="primary-link desktop-only" href="/loans/new"><Plus size={18} />Tạo khoản vay</Link> : null}
      </div>

      <section className="management-filters loan-filters" aria-labelledby="loan-filter-title">
        <div className="filter-heading"><div><h2 id="loan-filter-title"><SlidersHorizontal size={18} /> Tìm và lọc</h2></div>{hasFilters ? <Link className="clear-filter-link" href="/loans"><X size={17} /> Xóa tất cả</Link> : null}</div>
        <form className="filter-form loan-filter-form" method="get" key={`${query}:${direction ?? ""}:${status ?? ""}:${disbursedFrom ?? ""}:${disbursedTo ?? ""}:${sort}`}>
          <div className="loan-filter-primary">
            <div className="field-group filter-search"><label className="sr-only" htmlFor="loanSearch">Tên khoản vay hoặc đối tác</label><span className="input-with-icon"><Search size={18} aria-hidden="true" /><input id="loanSearch" name="q" type="search" defaultValue={query} placeholder="Tìm tên khoản vay hoặc đối tác..." /></span></div>
            <div className="field-group"><label className="sr-only" htmlFor="loanDirection">Hướng</label><select id="loanDirection" name="direction" defaultValue={direction ?? ""}><option value="">Hướng: Tất cả</option><option value="LENDING">Cho vay</option><option value="BORROWING">Đi vay</option></select></div>
            <div className="field-group"><label className="sr-only" htmlFor="loanStatus">Trạng thái</label><select id="loanStatus" name="status" defaultValue={status ?? ""}><option value="">Trạng thái: Tất cả</option><option value="ACTIVE">Đang hoạt động</option><option value="BAD_DEBT">Nợ xấu</option><option value="OVERDUE">Quá hạn</option><option value="SETTLED">Đã tất toán</option></select></div>
            <button className="primary-button loan-filter-submit" type="submit">Áp dụng</button>
          </div>
          <div className="filter-actions"><span>{loans.length} kết quả</span><div><LoanAdvancedFilters disbursedFrom={disbursedFrom} disbursedTo={disbursedTo} sort={sort} active={Boolean(disbursedFrom || disbursedTo || sort !== "newest")} /></div></div>
        </form>
      </section>

      {hasFilters ? <div className="filter-pills active-filter-pills" aria-label="Bộ lọc đang áp dụng">
        {query ? <Link href={withoutFilter("q")}>Tìm: {query}<X size={14} /></Link> : null}
        {direction ? <Link href={withoutFilter("direction")}>{direction === "LENDING" ? "Cho vay" : "Đi vay"}<X size={14} /></Link> : null}
        {status ? <Link href={withoutFilter("status")}>{statusLabels[status]}<X size={14} /></Link> : null}
        {disbursedFrom ? <Link href={withoutFilter("from")}>Từ {formatDate(disbursedFrom)}<X size={14} /></Link> : null}
        {disbursedTo ? <Link href={withoutFilter("to")}>Đến {formatDate(disbursedTo)}<X size={14} /></Link> : null}
        {sort !== "newest" ? <Link href={withoutFilter("sort")}>Đã đổi sắp xếp<X size={14} /></Link> : null}
      </div> : null}

      {loans.length === 0 ? (
        <section className="empty-state">
          <span className="empty-icon"><CircleAlert size={28} /></span>
          <h2>{hasFilters ? "Không tìm thấy khoản phù hợp" : "Chưa có khoản vay"}</h2>
          <p>{hasFilters ? "Hãy thử bỏ bớt điều kiện, kiểm tra tên đối tác hoặc xóa toàn bộ bộ lọc." : "Hãy thêm đối tác trước, sau đó tạo khoản vay đầu tiên."}</p>
          {hasFilters ? <div className="empty-actions"><Link className="secondary-link" href="/loans">Xóa bộ lọc</Link></div> : profile.role !== "VIEWER" ? <div className="empty-actions"><Link className="secondary-link" href="/counterparties">Thêm đối tác</Link><Link className="primary-link" href="/loans/new">Tạo khoản vay</Link></div> : null}
        </section>
      ) : (
        <section className="loan-list" aria-label="Danh sách khoản vay">
          <div className="loan-list-header" aria-hidden="true"><span>Khoản vay và đối tác</span><span>Dư nợ</span><span>Hành động kế tiếp</span></div>
          {loans.map((loan) => {
            const status = loan.calculation?.status ?? loan.status;
            const directionText = loan.direction === "LENDING" ? "Cho vay" : "Đi vay";
            const principalVnd = loan.calculation?.principalOutstandingVnd ?? loan.original_principal_vnd;
            const interestVnd = loan.calculation?.interestBalanceVnd ?? "0";
            const nextDate = status === "OVERDUE" && loan.maturity_date ? loan.maturity_date : loan.schedule.nextInterestDueDate;

            const counterpartyName = loan.counterparties?.name ?? "";
            let displayName = loan.name;
            if (counterpartyName && displayName.startsWith(`${counterpartyName} · `)) {
              const rest = displayName.slice(`${counterpartyName} · `.length);
              displayName = rest.split(" · ")[0] || counterpartyName;
            } else if (displayName.includes(" · ")) {
              displayName = displayName.split(" · ")[0];
            }

            const subtitleText = counterpartyName && counterpartyName !== displayName
              ? `${counterpartyName} · Giải ngân ${formatDate(loan.disbursement_date)}`
              : `Giải ngân ${formatDate(loan.disbursement_date)}`;

            return (
              <Link className="loan-card" href={`/loans/${loan.id}?returnTo=${encodeURIComponent(returnTo)}`} key={loan.id}>
                <div className="loan-card-icon" data-direction={loan.direction}>{loan.direction === "LENDING" ? <ArrowUpRight /> : <ArrowDownLeft />}</div>
                <div className="loan-card-main">
                  <div className="loan-card-title">
                    <h2>{displayName}</h2>
                    <span className="direction-badge" data-direction={loan.direction}>{directionText}</span>
                    <span className="status-badge" data-status={status}>{statusLabels[status]}</span>
                  </div>
                  <p>{subtitleText}</p>
                </div>
                <dl className="loan-card-values">
                  <div>
                    <dt>Dư nợ gốc</dt>
                    <dd className="privacy-amount font-bold text-base sm:text-lg">{formatVnd(principalVnd)}</dd>
                  </div>
                  <div>
                    <dt>{status === "OVERDUE" ? "Quá hạn gốc" : loan.direction === "LENDING" ? "Cần thu lãi" : "Cần trả lãi"}</dt>
                    <dd>
                      <span className="privacy-amount">{status === "OVERDUE" ? formatVnd(principalVnd) : formatVnd(interestVnd)}</span>
                      <small className="text-muted block mt-0.5">{formatDate(nextDate)}</small>
                    </dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </section>
      )}
    </>
  );
}

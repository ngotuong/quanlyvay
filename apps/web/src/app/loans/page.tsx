import { Pagination, parsePage } from "@/components/business/pagination";
import { PrivacyAmount, PrivacyRegion } from "@/components/app/privacy-provider";
import Link from "next/link";
import { ArrowLeftRight, CircleAlert, HandCoins, Landmark, Plus, X } from "lucide-react";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { LoanFilters } from "@/components/business/loan-filters";
import { LoanCardLink } from "@/components/business/loan-card-link";
import { isValidBusinessDate } from "@/lib/business/dashboard-period";
import { formatDate, formatPercent, formatVnd, periodRateInput } from "@/lib/business/format";
import { listLoans } from "@/lib/business/queries";
import type { LoanListFilters } from "@/lib/business/queries";
import type { LoanDirection, LoanStatus } from "@/lib/business/types";
import { Badge } from "@/components/ui";

const statusLabels: Record<LoanStatus, string> = { ACTIVE: "Đang hoạt động", OVERDUE: "Quá hạn", BAD_DEBT: "Nợ xấu", SETTLED: "Đã tất toán" };

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoansPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const profile = await requireAuthenticatedProfile();
  const params = await searchParams;
  const page = parsePage(params.page);
  const query = single(params.q)?.trim().slice(0, 120) ?? "";
  const rawDirection = single(params.direction);
  const direction = rawDirection === "LENDING" || rawDirection === "BORROWING" ? rawDirection as LoanDirection : undefined;
  const rawStatus = single(params.status);
  const showAllStatuses = rawStatus === "ALL";
  const status = showAllStatuses ? undefined : rawStatus && rawStatus in statusLabels ? rawStatus as LoanStatus : "ACTIVE";
  const rawDisbursedFrom = single(params.from);
  const rawDisbursedTo = single(params.to);
  const disbursedFrom = isValidBusinessDate(rawDisbursedFrom) ? rawDisbursedFrom : undefined;
  const disbursedTo = isValidBusinessDate(rawDisbursedTo) ? rawDisbursedTo : undefined;
  const rawSort = single(params.sort);
  const sort: NonNullable<LoanListFilters["sort"]> = rawSort === "oldest" || rawSort === "outstanding_desc" || rawSort === "name" ? rawSort : "newest";
  const hasFilters = Boolean(query || direction || status || disbursedFrom || disbursedTo || sort !== "newest");
  const loanResult = await listLoans({ query, direction, status, disbursedFrom, disbursedTo, sort }, page);
  const loans = loanResult.items;
  const currentQuery = new URLSearchParams();
  if (query) currentQuery.set("q", query);
  if (direction) currentQuery.set("direction", direction);
  if (showAllStatuses) currentQuery.set("status", "ALL");
  else if (rawStatus && status) currentQuery.set("status", status);
  if (disbursedFrom) currentQuery.set("from", disbursedFrom);
  if (disbursedTo) currentQuery.set("to", disbursedTo);
  if (sort !== "newest") currentQuery.set("sort", sort);
  if (page > 1) currentQuery.set("page", String(page));
  const returnTo = currentQuery.size ? `/loans?${currentQuery.toString()}` : "/loans";
  const withoutFilter = (key: string) => {
    const url = new URLSearchParams(currentQuery);
    if (key === "status") url.set("status", "ALL");
    else url.delete(key);
    url.delete("page");
    const queryString = url.toString();
    return queryString ? `/loans?${queryString}` : "/loans";
  };

  return (
    <>
      <div className="page-heading-row loans-heading">
        <div className="page-title-lockup"><span className="page-title-icon"><ArrowLeftRight size={24} strokeWidth={1.8} /></span><div><h1>Các khoản vay</h1><p className="page-description">Tìm theo đối tác, trạng thái hoặc thời điểm giải ngân.</p></div></div>
        {profile.role !== "VIEWER" ? <Link className="primary-link loan-create-link" href="/loans/new"><Plus size={18} />Tạo khoản vay</Link> : null}
      </div>

      <LoanFilters initial={{ query, direction: direction ?? "", status: showAllStatuses ? "ALL" : status ?? "ACTIVE", disbursedFrom: disbursedFrom ?? "", disbursedTo: disbursedTo ?? "", sort }} resultCount={loanResult.totalCount} hasFilters={hasFilters} />

      {hasFilters ? <div className="filter-pills active-filter-pills" aria-label="Bộ lọc đang áp dụng">
        {query ? <Link href={withoutFilter("q")}>Tìm: <PrivacyRegion>{query}</PrivacyRegion><X size={14} /></Link> : null}
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
          {hasFilters ? <div className="empty-actions"><Link className="secondary-link" href="/loans?status=ALL">Xóa bộ lọc</Link></div> : profile.role !== "VIEWER" ? <div className="empty-actions"><Link className="secondary-link" href="/counterparties">Thêm đối tác</Link><Link className="primary-link" href="/loans/new">Tạo khoản vay</Link></div> : null}
        </section>
      ) : (
        <section className="loan-list" aria-label="Danh sách khoản vay">
          {loans.map((loan) => {
            const status = loan.calculation?.status ?? loan.status;
            const directionText = loan.direction === "LENDING" ? "Cho vay" : "Đi vay";
            const principalVnd = loan.calculation?.principalOutstandingVnd ?? loan.original_principal_vnd;
            const interestVnd = loan.calculation?.interestBalanceVnd ?? "0";
            const nextDate = status === "OVERDUE" && loan.maturity_date ? loan.maturity_date : loan.schedule.nextInterestDueDate;

            const counterpartyName = loan.counterparties?.name ?? "";
            const displayName = counterpartyName && loan.name.startsWith(`${counterpartyName} · `) ? counterpartyName : loan.name;

            const periodRate = formatPercent(periodRateInput(loan.initial_daily_rate_percent, loan.interest_cycle_days));

            return (
              <LoanCardLink direction={loan.direction} href={`/loans/${loan.id}?returnTo=${encodeURIComponent(returnTo)}`} quickActionHref={profile.role !== "VIEWER" && status !== "SETTLED" ? `/loans/${loan.id}?transaction=1&returnTo=${encodeURIComponent(returnTo)}` : undefined} key={loan.id}>
                <div className="loan-card-icon" data-direction={loan.direction}>{loan.direction === "LENDING" ? <HandCoins /> : <Landmark />}</div>
                <div className="loan-card-main">
                  <div className="loan-card-heading">
                    <div className="loan-card-title"><h2><PrivacyRegion>{displayName}</PrivacyRegion></h2><p>Gốc ban đầu <span className="privacy-amount"><PrivacyAmount value={formatVnd(loan.original_principal_vnd)} /></span></p></div>
                    <div className="loan-card-tags"><Badge className="direction-badge" tone={loan.direction === "LENDING" ? "lending" : "borrowing"} data-direction={loan.direction}>{directionText}</Badge><Badge className="status-badge" tone={status === "ACTIVE" ? "success" : status === "SETTLED" ? "neutral" : status === "OVERDUE" ? "warning" : "danger"} data-status={status}>{statusLabels[status]}</Badge></div>
                  </div>
                  <dl className="loan-card-details">
                    <div><dt>Giải ngân</dt><dd>{formatDate(loan.disbursement_date)}</dd></div>
                    <div><dt>Lãi suất</dt><dd>{periodRate}/{loan.interest_cycle_days} ngày</dd></div>
                    <div><dt>{status === "SETTLED" ? "Ngày tất toán" : "Ngày đóng lãi"}</dt><dd>{formatDate(status === "SETTLED" ? loan.settled_on : nextDate)}</dd></div>
                  </dl>
                </div>
                <dl className="loan-card-values">
                  <div>
                    <dt>Dư nợ gốc</dt>
                    <dd className="privacy-amount font-bold text-base sm:text-lg"><PrivacyAmount value={formatVnd(principalVnd)} /></dd>
                  </div>
                  <div>
                    <dt>{loan.direction === "LENDING" ? "Lãi phải thu" : "Lãi phải trả"}</dt>
                    <dd><span className="privacy-amount"><PrivacyAmount value={formatVnd(interestVnd)} /></span></dd>
                  </div>
                  <div><dt>{loan.direction === "LENDING" ? "Lãi đã thu" : "Lãi đã trả"}</dt><dd><span className="privacy-amount"><PrivacyAmount value={formatVnd(loan.interestRecordedVnd)} /></span></dd></div>
                </dl>
              </LoanCardLink>
            );
          })}
        </section>
      )}
      <Pagination page={page} total={loanResult.totalCount} href={returnTo} />
    </>
  );
}

import { redirect } from "next/navigation";
import { clampPage, pageHref } from "@/lib/business/list-page.mjs";
import { RenderRevision } from "@/components/app/render-revision";
import { Pagination, parsePage } from "@/components/business/pagination";
import { PrivacyRegion } from "@/components/app/privacy-provider";
import { ContactRound, Search, UserRound, X } from "lucide-react";
import { DeleteCounterpartyButton } from "@/components/business/delete-counterparty-button";
import { CounterpartyCreateSheet } from "@/components/business/counterparty-create-sheet";
import { CounterpartyEditor } from "@/components/business/counterparty-editor";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { listCounterparties } from "@/lib/business/queries";
import { Card } from "@/components/ui";

export default async function CounterpartiesPage({ searchParams }: { searchParams: Promise<{ page?: string; deleted?: string; q?: string }> }) {
  const profile = await requireAuthenticatedProfile();
  const counterparties = await listCounterparties();
  const params = await searchParams;
  const page = parsePage(params.page);
  const canWrite = profile.role !== "VIEWER";
  const query = params.q?.trim() ?? "";
  const normalizedQuery = query.toLocaleLowerCase("vi");
  const filtered = normalizedQuery ? counterparties.filter(item => `${item.name} ${item.notes ?? ""}`.toLocaleLowerCase("vi").includes(normalizedQuery)) : counterparties;
  const paginationHref = query ? `/counterparties?q=${encodeURIComponent(query)}` : "/counterparties";
  const canonicalPage = clampPage(page, filtered.length);
  if (page !== canonicalPage) redirect(pageHref(paginationHref, canonicalPage));

  return (
    <>
      <RenderRevision />
      <div className="page-heading-row"><div className="page-title-lockup"><span className="page-title-icon"><ContactRound size={24} strokeWidth={1.8} /></span><div><h1>Đối tác</h1><p className="page-description">Tìm liên hệ trước, chỉ mở biểu mẫu khi cần thêm hoặc sửa.</p></div></div>{canWrite ? <CounterpartyCreateSheet /> : null}</div>
      {params.deleted === "1" ? <p className="action-message" data-success="true" role="status">Đã xóa đối tác chưa có lịch sử.</p> : null}
      <form className="counterparty-search" action="/counterparties" method="get" role="search">
        <label className="sr-only" htmlFor="counterparty-search">Tìm tên hoặc ghi chú đối tác</label>
        <span className="input-with-icon"><Search size={18} aria-hidden="true" /><input id="counterparty-search" name="q" type="search" defaultValue={query} placeholder="Tìm tên hoặc ghi chú đối tác…" /></span>
        <button className="secondary-button" type="submit">Tìm kiếm</button>
        {query ? <a className="secondary-link" href="/counterparties"><X size={17} /> Xóa tìm kiếm</a> : null}
      </form>
      <section className="counterparty-list compact-record-list" aria-label="Danh sách đối tác" aria-live="polite">
          {filtered.length === 0 ? <div className="empty-state compact"><UserRound size={26} /><h2>{query ? "Không tìm thấy đối tác" : "Chưa có đối tác"}</h2><p>{query ? "Thử tên hoặc ghi chú khác." : "Dùng nút Thêm đối tác để tạo liên hệ đầu tiên."}</p>{query ? <a className="secondary-link" href="/counterparties">Xem toàn bộ đối tác</a> : null}</div> : filtered.slice((page-1)*25, page*25).map((item) => (
            <Card as="article" variant="interactive" className="surface-card counterparty-card" key={item.id}>
              <div className="counterparty-card-heading"><div><h2><PrivacyRegion>{item.name}</PrivacyRegion></h2><p className="notes-copy"><PrivacyRegion>{item.notes || "Không có ghi chú."}</PrivacyRegion></p></div>{profile.role === "OWNER" ? <PrivacyRegion><DeleteCounterpartyButton menu id={item.id} name={item.name} /></PrivacyRegion> : null}</div>
              {canWrite ? <CounterpartyEditor counterparty={item} /> : null}
            </Card>
          ))}
      </section>
      <Pagination page={page} total={filtered.length} href={paginationHref} />
    </>
  );
}

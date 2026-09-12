import { RenderRevision } from "@/components/app/render-revision";
import { Pagination, parsePage } from "@/components/business/pagination";
import { PrivacyForm, PrivacyRegion } from "@/components/app/privacy-provider";
import { ContactRound, UserRound } from "lucide-react";
import { CounterpartyForm } from "@/components/business/counterparty-form";
import { DeleteCounterpartyButton } from "@/components/business/delete-counterparty-button";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { listCounterparties } from "@/lib/business/queries";
import { Card } from "@/components/ui";

export default async function CounterpartiesPage({ searchParams }: { searchParams: Promise<{ page?: string; deleted?: string }> }) {
  const profile = await requireAuthenticatedProfile();
  const counterparties = await listCounterparties();
  const params = await searchParams;
  const page = parsePage(params.page);
  const canWrite = profile.role !== "VIEWER";

  return (
    <>
      <RenderRevision />
      <div className="page-heading-row"><div className="page-title-lockup"><span className="page-title-icon"><ContactRound size={24} strokeWidth={1.8} /></span><div><h1>Đối tác</h1></div></div></div>
      {params.deleted === "1" ? <p className="action-message" data-success="true" role="status">Đã xóa đối tác chưa có lịch sử.</p> : null}
      <div className="two-panel-layout">
        {canWrite ? <Card className="surface-card sticky-panel"><h2>Thêm đối tác</h2><PrivacyForm><CounterpartyForm /></PrivacyForm></Card> : null}
        <section className="counterparty-list" aria-label="Danh sách đối tác">
          {counterparties.length === 0 ? <div className="empty-state compact"><UserRound size={26} /><h2>Chưa có đối tác</h2><p>Danh sách sẽ xuất hiện tại đây.</p></div> : counterparties.slice((page-1)*25, page*25).map((item) => (
            <Card as="article" variant="interactive" className="surface-card counterparty-card" key={item.id}>
              <div className="counterparty-card-heading"><div><h2><PrivacyRegion>{item.name}</PrivacyRegion></h2></div>{profile.role === "OWNER" ? <PrivacyRegion><DeleteCounterpartyButton id={item.id} name={item.name} /></PrivacyRegion> : null}</div>
              {canWrite ? <details className="edit-details"><summary>Chỉnh sửa thông tin</summary><PrivacyForm><CounterpartyForm counterparty={item} /></PrivacyForm></details> : <p className="notes-copy"><PrivacyRegion>{item.notes || "Không có ghi chú."}</PrivacyRegion></p>}
            </Card>
          ))}
        </section>
      </div>
      <Pagination page={page} total={counterparties.length} href="/counterparties" />
    </>
  );
}

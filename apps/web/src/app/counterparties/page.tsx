import { UserRound } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { CounterpartyForm } from "@/components/business/counterparty-form";
import { DeleteCounterpartyButton } from "@/components/business/delete-counterparty-button";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate } from "@/lib/business/format";
import { listCounterparties } from "@/lib/business/queries";

export default async function CounterpartiesPage() {
  const profile = await requireAuthenticatedProfile();
  const counterparties = await listCounterparties();
  const canWrite = profile.role !== "VIEWER";

  return (
    <AppShell profile={profile}>
      <div className="page-heading-row"><div><p className="eyebrow">Danh bạ</p><h1>Đối tác</h1><p className="page-description">Người cho bạn vay hoặc người đang vay tiền của bạn.</p></div></div>
      <div className="two-panel-layout">
        {canWrite ? <section className="surface-card sticky-panel"><h2>Thêm đối tác</h2><CounterpartyForm /></section> : null}
        <section className="counterparty-list" aria-label="Danh sách đối tác">
          {counterparties.length === 0 ? <div className="empty-state compact"><UserRound size={26} /><h2>Chưa có đối tác</h2><p>Danh sách sẽ xuất hiện tại đây.</p></div> : counterparties.map((item) => (
            <article className="surface-card counterparty-card" key={item.id}>
              <div className="counterparty-card-heading"><div><h2>{item.name}</h2><p>Cập nhật {formatDate(item.updated_at)}</p></div>{profile.role === "OWNER" ? <DeleteCounterpartyButton id={item.id} name={item.name} /> : null}</div>
              {canWrite ? <details className="edit-details"><summary>Chỉnh sửa thông tin</summary><CounterpartyForm counterparty={item} /></details> : <p className="notes-copy">{item.notes || "Không có ghi chú."}</p>}
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

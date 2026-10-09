import { EmptyState } from "@/components/ui/empty-state";
import { PrivacyRegion } from "@/components/app/privacy-provider";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ScrollText } from "lucide-react";
import { requireOwnerProfile } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/business/format";
import { getAuditTableLabel, localizeAuditData } from "@/lib/business/localization";
import { listAuditLogs } from "@/lib/business/queries";

const actionLabels = { INSERT: "Tạo mới", UPDATE: "Cập nhật", DELETE: "Xóa" } as const;
const auditPageSize = 25;

function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function pageHref(page: number) {
  return page === 1 ? "/audit" : `/audit?page=${page}`;
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requireOwnerProfile();
  const requestedPage = parsePage((await searchParams).page);
  const result = await listAuditLogs(requestedPage, auditPageSize);
  if (result.totalCount > 0 && requestedPage > result.totalPages) redirect(pageHref(result.totalPages));
  const { logs, page, totalCount, totalPages } = result;
  return (
    <>
      <div className="page-heading-row"><div className="page-title-lockup"><span className="page-title-icon"><ScrollText size={24} strokeWidth={1.8} /></span><div><h1>Nhật ký hệ thống</h1></div></div></div>
      <section className="timeline-list">
        {logs.length === 0 ? <EmptyState as="div" className="compact"><h2>Chưa có lịch sử</h2></EmptyState> : logs.map((log) => (
          <article className="timeline-item" key={log.id}><span className="timeline-dot" data-action={log.action} /><div><div className="timeline-heading"><strong>{actionLabels[log.action]} · {getAuditTableLabel(log.table_name)}</strong><time>{formatDateTime(log.changed_at)}</time></div><p>Thực hiện bởi {log.profiles?.display_name ?? "Hệ thống"}</p><details><summary>Xem dữ liệu thay đổi</summary><PrivacyRegion><pre>{JSON.stringify({ "Trước thay đổi": localizeAuditData(log.old_data), "Sau thay đổi": localizeAuditData(log.new_data) }, null, 2)}</pre></PrivacyRegion></details></div></article>
        ))}
      </section>
      {totalCount > 0 ? <nav className="audit-pagination" aria-label="Phân trang nhật ký hệ thống">
        <p><strong>Trang {page} / {totalPages}</strong><span>{totalCount} bản ghi</span></p>
        <div>
          {page > 1 ? <Link className="secondary-link" href={pageHref(page - 1)} rel="prev">Trang trước</Link> : <span className="secondary-link" aria-disabled="true">Trang trước</span>}
          {page < totalPages ? <Link className="secondary-link" href={pageHref(page + 1)} rel="next">Trang sau</Link> : <span className="secondary-link" aria-disabled="true">Trang sau</span>}
        </div>
      </nav> : null}
    </>
  );
}

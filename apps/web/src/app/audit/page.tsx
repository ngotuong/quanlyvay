import { ScrollText } from "lucide-react";
import { requireOwnerProfile } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/business/format";
import { getAuditTableLabel, localizeAuditData } from "@/lib/business/localization";
import { listAuditLogs } from "@/lib/business/queries";

const actionLabels = { INSERT: "Tạo mới", UPDATE: "Cập nhật", DELETE: "Xóa" } as const;

export default async function AuditPage() {
  await requireOwnerProfile();
  const logs = await listAuditLogs();
  return (
    <>
      <div className="page-heading-row"><div className="page-title-lockup"><span className="page-title-icon"><ScrollText size={24} strokeWidth={1.8} /></span><div><h1>Nhật ký hệ thống</h1></div></div></div>
      <section className="timeline-list">
        {logs.length === 0 ? <div className="empty-state compact"><h2>Chưa có lịch sử</h2></div> : logs.map((log) => (
          <article className="timeline-item" key={log.id}><span className="timeline-dot" data-action={log.action} /><div><div className="timeline-heading"><strong>{actionLabels[log.action]} · {getAuditTableLabel(log.table_name)}</strong><time>{formatDateTime(log.changed_at)}</time></div><p>Thực hiện bởi {log.profiles?.display_name ?? "Hệ thống"}</p><details><summary>Xem dữ liệu thay đổi</summary><pre>{JSON.stringify({ "Trước thay đổi": localizeAuditData(log.old_data), "Sau thay đổi": localizeAuditData(log.new_data) }, null, 2)}</pre></details></div></article>
        ))}
      </section>
    </>
  );
}

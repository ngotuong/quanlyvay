import { AppShell } from "@/components/app/app-shell";
import { requireOwnerProfile } from "@/lib/auth/session";
import { formatDateTime } from "@/lib/business/format";
import { getUnreadNotificationCount, listAuditLogs } from "@/lib/business/queries";

const actionLabels = { INSERT: "Tạo mới", UPDATE: "Cập nhật", DELETE: "Xóa" } as const;

export default async function AuditPage() {
  const profile = await requireOwnerProfile();
  const [logs, unreadCount] = await Promise.all([
    listAuditLogs(),
    getUnreadNotificationCount(),
  ]);
  return (
    <AppShell profile={profile} unreadCount={unreadCount}>
      <div className="page-heading-row"><div><p className="eyebrow">Kiểm soát thay đổi</p><h1>Lịch sử chỉnh sửa</h1><p className="page-description">100 thay đổi gần nhất. Giao dịch tài chính không bị xóa khỏi lịch sử.</p></div></div>
      <section className="timeline-list">
        {logs.length === 0 ? <div className="empty-state compact"><h2>Chưa có lịch sử</h2></div> : logs.map((log) => (
          <article className="timeline-item" key={log.id}><span className="timeline-dot" data-action={log.action} /><div><div className="timeline-heading"><strong>{actionLabels[log.action]} · {log.table_name}</strong><time>{formatDateTime(log.changed_at)}</time></div><p>Thực hiện bởi {log.profiles?.display_name ?? "Hệ thống"}</p><details><summary>Xem dữ liệu thay đổi</summary><pre>{JSON.stringify({ trước: log.old_data, sau: log.new_data }, null, 2)}</pre></details></div></article>
        ))}
      </section>
    </AppShell>
  );
}

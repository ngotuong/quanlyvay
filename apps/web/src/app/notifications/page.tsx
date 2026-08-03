import Link from "next/link";
import { Bell, BellRing, CheckCheck, CircleAlert } from "lucide-react";
import { markNotificationsReadAction } from "@/app/actions/notifications";
import { AppShell } from "@/components/app/app-shell";
import { PushManager } from "@/components/notifications/push-manager";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate } from "@/lib/business/format";
import { getNotificationCenter } from "@/lib/business/queries";

export default async function NotificationsPage() {
  const profile = await requireAuthenticatedProfile();
  const notifications = await getNotificationCenter();
  const unread = notifications.filter((item) => !item.read_at);
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim() ?? "";

  return <AppShell profile={profile}>
    <div className="page-heading-row"><div><p className="eyebrow">Nhắc hạn</p><h1>Thông báo</h1><p className="page-description">Mọi tài khoản đều nhận cùng lịch nhắc, nhưng trạng thái đã đọc được lưu riêng.</p></div>
      {unread.length ? <form action={markNotificationsReadAction.bind(null, undefined)}><button className="secondary-button notification-read-all" type="submit"><CheckCheck size={18} />Đánh dấu đã đọc</button></form> : null}
    </div>
    <PushManager publicKey={publicKey} />
    {notifications.length === 0 ? <section className="empty-state notification-empty"><span className="empty-icon"><Bell size={28} /></span><h2>Chưa có thông báo</h2><p>Thông báo đóng lãi và quá hạn sẽ xuất hiện tại đây khi bộ nhắc lịch chạy.</p></section> :
      <section className="notification-list" aria-label="Danh sách thông báo">{notifications.map((item) => {
        const overdue = item.type === "LOAN_OVERDUE";
        const content = <><span className="notification-icon" data-overdue={overdue}>{overdue ? <CircleAlert size={20} /> : <BellRing size={20} />}</span><span className="notification-main"><span className="notification-title-row"><strong>{item.title}</strong>{!item.read_at ? <span className="unread-label">Mới</span> : null}</span><span>{item.body}</span><small>{formatDate(item.notification_date)}{item.loans?.name ? ` · ${item.loans.name}` : ""}</small></span></>;
        return item.loan_id ? <Link className="notification-item" data-read={Boolean(item.read_at)} href={`/loans/${item.loan_id}`} key={item.id}>{content}</Link> : <article className="notification-item" data-read={Boolean(item.read_at)} key={item.id}>{content}</article>;
      })}</section>}
  </AppShell>;
}

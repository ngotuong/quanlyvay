import Link from "next/link";
import { Pagination, parsePage } from "@/components/business/pagination";
import { PrivacyRegion } from "@/components/app/privacy-provider";
import { Bell, BellDot, BellRing, CheckCheck, CircleAlert } from "lucide-react";
import { markNotificationsReadAction, openNotificationAction } from "@/app/actions/notifications";
import { PushManager } from "@/components/notifications/push-manager";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate } from "@/lib/business/format";
import { getNotificationCenter, getUnreadNotificationCount } from "@/lib/business/queries";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string; unread?: string }> }) {
  const profile = await requireAuthenticatedProfile();
  const params = await searchParams;
  const page = parsePage(params.page);
  const result = await getNotificationCenter(page, params.unread === "true");
  const notifications = result.items;
  const unreadCount = await getUnreadNotificationCount();
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim() ?? "";

  return <>
    <div className="page-heading-row"><div className="page-title-lockup"><span className="page-title-icon"><BellDot size={24} strokeWidth={1.8} /></span><div><h1>Thông báo</h1></div></div>
      {unreadCount ? <form action={markNotificationsReadAction.bind(null, undefined)}><button className="secondary-button notification-read-all" type="submit"><CheckCheck size={18} />Đánh dấu đã đọc</button></form> : null}
    </div>
    <div className="filter-pills"><Link href="/notifications">Tất cả</Link><Link href="/notifications?unread=true">Chưa đọc ({unreadCount})</Link></div>
    <PushManager publicKey={publicKey} initialDeliveryHour={profile.notification_delivery_hour} showTestButton={process.env.VERCEL_ENV !== "production"} />
    {notifications.length === 0 ? <section className="empty-state notification-empty"><span className="empty-icon"><Bell size={28} /></span><h2>Chưa có thông báo</h2><p>Thông báo đóng lãi và quá hạn sẽ xuất hiện tại đây khi bộ nhắc lịch chạy.</p></section> :
      <section className="notification-list" aria-label="Danh sách thông báo">{notifications.map((item) => {
        const overdue = item.type === "LOAN_OVERDUE";
        const content = <><span className="notification-icon" data-overdue={overdue}>{overdue ? <CircleAlert size={20} /> : <BellRing size={20} />}</span><span className="notification-main"><span className="notification-title-row"><strong><PrivacyRegion>{item.title}</PrivacyRegion></strong>{!item.read_at ? <span className="unread-label">Mới</span> : null}</span><span className="notification-body"><PrivacyRegion>{item.body}</PrivacyRegion></span><small>{formatDate(item.notification_date)}<PrivacyRegion>{item.loans?.name ? ` · ${item.loans.name}` : ""}</PrivacyRegion></small></span></>;
        return item.loan_id ? <form action={openNotificationAction.bind(null, item.id)} className="notification-item-form" key={item.id}><button className="notification-item notification-item-button" data-read={Boolean(item.read_at)} type="submit">{content}</button></form> : <article className="notification-item" data-read={Boolean(item.read_at)} key={item.id}>{content}</article>;
      })}</section>}
    <Pagination page={page} total={result.totalCount} href={params.unread === "true" ? "/notifications?unread=true" : "/notifications"} />
  </>;
}

import { EmptyState } from "@/components/ui/empty-state";
import { redirect } from "next/navigation";
import { clampPage, pageHref } from "@/lib/business/list-page.mjs";
import Link from "next/link";
import { Pagination, parsePage } from "@/components/business/pagination";
import { PrivacyRegion } from "@/components/app/privacy-provider";
import { Bell, BellDot, BellRing, CircleAlert } from "lucide-react";
import { NotificationAction } from "@/components/notifications/notification-action";
import { PushManager } from "@/components/notifications/push-manager";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate } from "@/lib/business/format";
import { getNotificationCenter, getUnreadNotificationCount } from "@/lib/business/queries";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ page?: string; unread?: string }> }) {
  const profile = await requireAuthenticatedProfile();
  const params = await searchParams;
  const page = parsePage(params.page);
  const result = await getNotificationCenter(page, params.unread === "true");
  const canonicalPage = clampPage(page, result.totalCount);
  if (page !== canonicalPage) redirect(pageHref(params.unread === "true" ? "/notifications?unread=true" : "/notifications", canonicalPage));
  const notifications = result.items;
  const unreadCount = await getUnreadNotificationCount();
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim() ?? "";

  return <>
    <div className="page-heading-row"><div className="page-title-lockup"><span className="page-title-icon"><BellDot size={24} strokeWidth={1.8} /></span><div><h1>Thông báo</h1></div></div>
      <NotificationAction unreadCount={unreadCount} />
    </div>
    <div className="filter-pills"><Link href="/notifications" data-active={params.unread !== "true"} aria-current={params.unread !== "true" ? "page" : undefined}>Tất cả</Link><Link href="/notifications?unread=true" data-active={params.unread === "true"} aria-current={params.unread === "true" ? "page" : undefined}>Chưa đọc ({unreadCount})</Link></div>
    {notifications.length === 0 ? <EmptyState className="notification-empty"><span className="empty-icon"><Bell size={28} /></span><h2>{params.unread === "true" ? "Bạn đã đọc hết thông báo" : "Chưa có thông báo"}</h2><p>{params.unread === "true" ? "Không còn thông báo chưa đọc." : "Thông báo đóng lãi và quá hạn sẽ xuất hiện tại đây khi bộ nhắc lịch chạy."}</p>{params.unread === "true" ? <Link className="secondary-button" href="/notifications">Xem tất cả thông báo</Link> : null}</EmptyState> :
      <section className="notification-list" aria-label="Danh sách thông báo">{notifications.map((item) => {
        const overdue = item.type === "LOAN_OVERDUE";
        const content = <><span className="notification-icon" data-overdue={overdue}>{overdue ? <CircleAlert size={20} /> : <BellRing size={20} />}</span><span className="notification-main"><span className="notification-title-row"><strong><PrivacyRegion>{item.title}</PrivacyRegion></strong>{!item.read_at ? <span className="unread-label">Mới</span> : null}</span><span className="notification-body"><PrivacyRegion>{item.body}</PrivacyRegion></span><small>Ngày thông báo: {formatDate(item.notification_date)}</small></span></>;
        return item.loan_id ? <NotificationAction id={item.id} read={Boolean(item.read_at)} key={item.id}>{content}</NotificationAction> : <article className="notification-item" data-read={Boolean(item.read_at)} key={item.id}>{content}</article>;
      })}</section>}
    <PushManager publicKey={publicKey} initialDeliveryHour={profile.notification_delivery_hour} showTestButton={process.env.VERCEL_ENV !== "production"} />
    <Pagination page={page} total={result.totalCount} href={params.unread === "true" ? "/notifications?unread=true" : "/notifications"} />
  </>;
}

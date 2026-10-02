"use client";

import { CheckCheck, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { markNotificationsReadAction, openNotificationAction } from "@/app/actions/notifications";
import { useBusinessAction } from "@/components/business/use-business-action";
import { ActionMessage } from "@/components/business/form-parts";
import { initialBusinessActionState } from "@/lib/business/action-state";

export function NotificationAction({ id, read = false, unreadCount = 0, children }: { id?: string; read?: boolean; unreadCount?: number; children?: ReactNode }) {
  const [state, action, pending] = useBusinessAction(async () => id ? openNotificationAction(id) : markNotificationsReadAction(), initialBusinessActionState);
  return <form className={id ? "notification-item-form" : "notification-read-form"} aria-busy={pending} onSubmit={event => { event.preventDefault(); void action(new FormData(event.currentTarget)); }}>
    <button disabled={pending || (!id && !unreadCount)} className={id ? "notification-item notification-item-button" : "secondary-button notification-read-all"} data-read={read} type="submit">
      {id ? <>{children}{pending ? <span role="status" className="notification-pending"><LoaderCircle size={18} className="spin" />Đang mở thông báo…</span> : null}</> : <><CheckCheck size={18} />{pending ? "Đang đánh dấu đã đọc…" : unreadCount ? "Đánh dấu đã đọc" : "Đã đọc tất cả"}</>}
    </button>
    <ActionMessage state={state} />
    {!state.ok && state.message ? <button className="secondary-button" disabled={pending} type="submit">Thử lại</button> : null}
  </form>;
}

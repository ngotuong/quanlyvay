"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, HandCoins, History, LayoutDashboard, ReceiptText, Settings, Users } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/loans", label: "Khoản vay", icon: HandCoins },
  { href: "/counterparties", label: "Đối tác", icon: Users },
  { href: "/expenses", label: "Chi phí", icon: ReceiptText },
  { href: "/notifications", label: "Thông báo", icon: Bell, notificationItem: true },
  { href: "/audit", label: "Lịch sử", icon: History, ownerOnly: true },
  { href: "/settings", label: "Cài đặt", icon: Settings, ownerOnly: true },
];

export function AppNav({ isOwner, unreadCount = 0 }: { isOwner: boolean; unreadCount?: number }) {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState<{ fromPathname: string; href: string } | null>(null);
  const pendingHref = pendingNavigation?.fromPathname === pathname ? pendingNavigation.href : null;

  return (
    <nav className="app-nav" aria-label="Điều hướng chính" aria-busy={Boolean(pendingHref)}>
      <span className="route-progress" data-visible={Boolean(pendingHref)} aria-hidden="true" />
      {pendingHref ? <span className="sr-only" role="status" aria-live="polite">Đang mở module…</span> : null}
      {items.filter((item) => !item.ownerOnly || isOwner).map((item) => {
        const active = pathname.startsWith(item.href);
        const pending = pendingHref === item.href;
        const Icon = item.icon;
        return (
          <Link
            className="nav-link"
            data-active={active}
            data-pending={pending}
            href={item.href}
            key={item.href}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              if (!active && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
                setPendingNavigation({ fromPathname: pathname, href: item.href });
              }
            }}
            prefetch
          >
            <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>{item.label}</span>
            {pending ? <span className="nav-pending-dot" aria-hidden="true" /> : null}
            {item.notificationItem && unreadCount > 0 ? <span className="nav-badge" aria-label={`${unreadCount} thông báo chưa đọc`}>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function BrandIcon() {
  return <LayoutDashboard aria-hidden="true" size={22} strokeWidth={1.8} />;
}

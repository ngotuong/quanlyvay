"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { UserRound } from "lucide-react";
import { ArrowLeftRight, BellDot, ContactRound, LayoutGrid, MoreHorizontal, ScrollText, SlidersHorizontal, WalletCards } from "lucide-react";

const primaryItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutGrid },
  { href: "/loans", label: "Khoản vay", icon: ArrowLeftRight },
  { href: "/counterparties", label: "Đối tác", icon: ContactRound },
  { href: "/notifications", label: "Thông báo", icon: BellDot, notificationItem: true },
];

const secondaryItems = [
  { href: "/account", label: "Tài khoản của tôi", icon: UserRound },
  { href: "/expenses", label: "Chi phí", icon: WalletCards },
  { href: "/audit", label: "Nhật ký hệ thống", icon: ScrollText, ownerOnly: true },
  { href: "/settings", label: "Cài đặt", icon: SlidersHorizontal, ownerOnly: true },
];

export function AppNav({ isOwner, unreadCount = 0 }: { isOwner: boolean; unreadCount?: number }) {
  const pathname = usePathname();
  const more = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (more.current) more.current.open = false;
  }, [pathname]);
  useEffect(() => {
    function outside(event: PointerEvent) {
      if (more.current && !more.current.contains(event.target as Node)) more.current.open = false;
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape" && more.current?.open) {
        more.current.open = false;
        more.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, []);
  const visibleSecondaryItems = secondaryItems.filter((item) => !item.ownerOnly || isOwner);
  const secondaryActive = visibleSecondaryItems.some((item) => pathname.startsWith(item.href));

  return (
    <nav className="app-nav" aria-label="Điều hướng chính">
      {primaryItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            className="nav-link mobile-primary-nav-item"
            data-active={active}
            href={item.href}
            key={item.href}
            aria-current={active ? "page" : undefined}
            prefetch={false}
          >
            <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>{item.label}</span>
            {item.notificationItem && unreadCount > 0 ? <span className="nav-badge" aria-label={`${unreadCount} thông báo chưa đọc`}>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
          </Link>
        );
      })}
      {visibleSecondaryItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return <Link className="nav-link desktop-secondary-nav-item" data-active={active} href={item.href} key={item.href} aria-current={active ? "page" : undefined} prefetch={false}><Icon aria-hidden="true" size={20} strokeWidth={1.8} /><span>{item.label}</span></Link>;
      })}
      <details className="mobile-more-nav" ref={more}>
        <summary className="nav-link" data-active={secondaryActive}><MoreHorizontal aria-hidden="true" size={20} strokeWidth={1.8} /><span>Thêm</span></summary>
        <div className="mobile-more-menu">
          <p>Tiện ích khác</p>
          {visibleSecondaryItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return <Link data-active={active} href={item.href} key={item.href}><Icon aria-hidden="true" size={20} /><span>{item.label}</span></Link>;
          })}
        </div>
      </details>
    </nav>
  );
}

export function BrandIcon() {
  return <Image className="brand-symbol" src="/icons/app-icon-192.png" alt="" width={32} height={32} priority />;
}

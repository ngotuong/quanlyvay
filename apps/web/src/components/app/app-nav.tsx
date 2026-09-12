"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { UserRound } from "lucide-react";
import { ArrowLeftRight, BellDot, ContactRound, LayoutGrid, MoreHorizontal, ScrollText, SlidersHorizontal, WalletCards } from "lucide-react";
import { BottomSheet, Button } from "@/components/ui";

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
  const more = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (more.current?.open) more.current.close();
  }, [pathname]);
  useEffect(() => () => { if (closeTimer.current) clearTimeout(closeTimer.current); }, []);
  function openMore() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    more.current?.classList.remove("is-closing");
    if (more.current && !more.current.open) more.current.showModal();
  }
  function closeMore() {
    const dialog = more.current;
    if (!dialog?.open || dialog.classList.contains("is-closing")) return;
    dialog.classList.add("is-closing");
    closeTimer.current = setTimeout(() => {
      dialog.close();
      dialog.classList.remove("is-closing");
      closeTimer.current = null;
    }, 180);
  }
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
      <div className="mobile-more-nav">
        <Button variant="ghost" className="nav-link mobile-more-trigger" data-active={secondaryActive} aria-haspopup="dialog" onClick={openMore}><MoreHorizontal aria-hidden="true" size={20} strokeWidth={1.8} /><span>Thêm</span></Button>
        <BottomSheet className="mobile-more-sheet" title="Tiện ích khác" ref={more} onRequestClose={closeMore}>
          <div className="mobile-more-sheet-links">
          {visibleSecondaryItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return <Link data-active={active} aria-current={active ? "page" : undefined} href={item.href} key={item.href}><Icon aria-hidden="true" size={20} /><span>{item.label}</span></Link>;
          })}
          </div>
        </BottomSheet>
      </div>
    </nav>
  );
}

export function BrandIcon() {
  return <Image className="brand-symbol" src="/icons/brand-symbol-192.png" alt="" width={32} height={32} priority />;
}

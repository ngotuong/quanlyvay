"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HandCoins, History, LayoutDashboard, Users } from "lucide-react";

const items = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/loans", label: "Khoản vay", icon: HandCoins },
  { href: "/counterparties", label: "Đối tác", icon: Users },
  { href: "/audit", label: "Lịch sử", icon: History, ownerOnly: true },
];

export function AppNav({ isOwner }: { isOwner: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="app-nav" aria-label="Điều hướng chính">
      {items.filter((item) => !item.ownerOnly || isOwner).map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link className="nav-link" data-active={active} href={item.href} key={item.href} aria-current={active ? "page" : undefined}>
            <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BrandIcon() {
  return <LayoutDashboard aria-hidden="true" size={22} strokeWidth={1.8} />;
}

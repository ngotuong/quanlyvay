"use client";

import { usePathname } from "next/navigation";
import { ArrowLeftRight, BellDot, ChartSpline, ContactRound, KeyRound, PlusCircle, ScrollText, SlidersHorizontal, WalletCards } from "lucide-react";

const moduleRoutes = [
  { match: (path: string) => path === "/dashboard", label: "Tổng quan", icon: ChartSpline },
  { match: (path: string) => path === "/loans/new", label: "Tạo khoản vay", icon: PlusCircle },
  { match: (path: string) => /^\/loans\/[^/]+/.test(path), label: "Chi tiết khoản vay", icon: WalletCards },
  { match: (path: string) => path.startsWith("/loans"), label: "Các khoản vay", icon: ArrowLeftRight },
  { match: (path: string) => path.startsWith("/counterparties"), label: "Đối tác", icon: ContactRound },
  { match: (path: string) => path.startsWith("/notifications"), label: "Thông báo", icon: BellDot },
  { match: (path: string) => path.startsWith("/expenses"), label: "Chi phí", icon: WalletCards },
  { match: (path: string) => path.startsWith("/audit"), label: "Nhật ký hệ thống", icon: ScrollText },
  { match: (path: string) => path.startsWith("/change-password"), label: "Đổi mật khẩu", icon: KeyRound },
  { match: (path: string) => path.startsWith("/settings"), label: "Cài đặt tài khoản", icon: SlidersHorizontal },
];

export function MobileModuleTitle() {
  const pathname = usePathname();
  const current = moduleRoutes.find((item) => item.match(pathname)) ?? moduleRoutes[0];
  const Icon = current.icon;
  return <div className="mobile-module-title"><Icon size={21} strokeWidth={1.8} aria-hidden="true" /><strong>{current.label}</strong></div>;
}

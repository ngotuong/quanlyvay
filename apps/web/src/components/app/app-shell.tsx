import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { AppProfile } from "@/lib/auth/types";
import { AppNav, BrandIcon } from "./app-nav";
import { PrivacyToggle } from "./privacy-provider";
import { MobileModuleTitle } from "./mobile-module-title";
import { ToastProvider } from "@/components/ui";

const roleLabels = { OWNER: "Chủ tài khoản", EDITOR: "Biên tập", VIEWER: "Chỉ xem" } as const;

export function AppShell({
  profile,
  children,
  unreadCount = 0,
}: {
  profile: AppProfile;
  children: React.ReactNode;
  unreadCount?: number;
}) {
  return (
    <div className="app-frame">
      <ToastProvider />
      <aside className="app-sidebar">
        <Link className="app-brand" href="/dashboard" aria-label="Quản Lý Vay Cá Nhân - Trang tổng quan">
          <span className="app-brand-icon"><BrandIcon /></span>
          <span><strong>Quản Lý Vay</strong><small>Cá nhân</small></span>
        </Link>
        <AppNav isOwner={profile.role === "OWNER"} unreadCount={unreadCount} />
        <div className="sidebar-profile">
          <span className="profile-avatar" aria-hidden="true">{profile.display_name.slice(0, 1).toUpperCase()}</span>
          <span className="profile-copy"><strong>{profile.display_name}</strong><small>{roleLabels[profile.role]}</small></span>
          <PrivacyToggle />
          <form action={logoutAction}>
            <button className="icon-button" type="submit" aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={19} /></button>
          </form>
        </div>
      </aside>

      <div className="app-main-column">
        <header className="mobile-header">
          <MobileModuleTitle />
          <div className="flex items-center gap-2">
            <PrivacyToggle />
          </div>
        </header>
        <main className="app-content" id="main-content" tabIndex={-1}>{children}</main>
        <div className="mobile-nav-wrap"><AppNav isOwner={profile.role === "OWNER"} unreadCount={unreadCount} /></div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { LogOut, Plus } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { AppProfile } from "@/lib/auth/types";
import { AppNav, BrandIcon } from "./app-nav";

const roleLabels = { OWNER: "Chủ tài khoản", EDITOR: "Biên tập", VIEWER: "Chỉ xem" } as const;

export function AppShell({
  profile,
  children,
  showCreateLoan = false,
}: {
  profile: AppProfile;
  children: React.ReactNode;
  showCreateLoan?: boolean;
}) {
  return (
    <div className="app-frame">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/dashboard" aria-label="Quản Lý Vay Cá Nhân - Trang tổng quan">
          <span className="app-brand-icon"><BrandIcon /></span>
          <span><strong>Quản Lý Vay</strong><small>Cá nhân</small></span>
        </Link>
        <AppNav isOwner={profile.role === "OWNER"} />
        <div className="sidebar-profile">
          <span className="profile-avatar" aria-hidden="true">{profile.display_name.slice(0, 1).toUpperCase()}</span>
          <span className="profile-copy"><strong>{profile.display_name}</strong><small>{roleLabels[profile.role]}</small></span>
          <form action={logoutAction}>
            <button className="icon-button" type="submit" aria-label="Đăng xuất" title="Đăng xuất"><LogOut size={19} /></button>
          </form>
        </div>
      </aside>

      <div className="app-main-column">
        <header className="mobile-header">
          <Link className="mobile-brand" href="/dashboard"><BrandIcon /><strong>Quản Lý Vay</strong></Link>
          {showCreateLoan && profile.role !== "VIEWER" ? (
            <Link className="header-create-link" href="/loans/new"><Plus size={18} /> Tạo khoản vay</Link>
          ) : null}
        </header>
        <main className="app-content" id="main-content">{children}</main>
        <div className="mobile-nav-wrap"><AppNav isOwner={profile.role === "OWNER"} /></div>
      </div>
    </div>
  );
}

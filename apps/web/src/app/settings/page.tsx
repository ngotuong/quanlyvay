import { ThemeSettings } from "@/components/app/theme-provider";
import { RenderRevision } from "@/components/app/render-revision";
import Link from "next/link";
import { KeyRound, LogOut, SlidersHorizontal } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { UserManagement } from "@/components/auth/user-management";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { listManagedProfiles } from "@/lib/business/queries";
import { Card } from "@/components/ui";

const roleLabels = { OWNER: "Chủ tài khoản", EDITOR: "Biên tập", VIEWER: "Chỉ xem" } as const;

export default async function SettingsPage() {
  const profile = await requireAuthenticatedProfile();
  const isOwner = profile.role === "OWNER";
  const profiles = isOwner ? await listManagedProfiles() : [];

  return (
    <>
      <RenderRevision />
      <div className="page-heading-row"><div className="page-title-lockup"><span className="page-title-icon"><SlidersHorizontal size={24} strokeWidth={1.8} /></span><div><h1>Cài đặt</h1></div></div></div>
      <ThemeSettings />
      <Card className="surface-card detail-section account-settings-card">
        <div><p className="eyebrow">Tài khoản của tôi</p><h2>{profile.display_name}</h2><p className="notes-copy">{profile.username} · {roleLabels[profile.role]}</p></div>
        <div className="account-settings-actions">
          <Link className="secondary-link" href="/change-password"><KeyRound size={18} />Đổi mật khẩu</Link>
          <form action={logoutAction}><button className="secondary-button" type="submit"><LogOut size={18} />Đăng xuất</button></form>
        </div>
      </Card>
      {isOwner ? <UserManagement profiles={profiles} ownerId={profile.user_id} /> : null}
    </>
  );
}

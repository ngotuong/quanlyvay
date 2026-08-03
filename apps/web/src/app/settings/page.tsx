import Link from "next/link";
import { AppShell } from "@/components/app/app-shell";
import { UserManagement } from "@/components/auth/user-management";
import { requireOwnerProfile } from "@/lib/auth/session";
import { getUnreadNotificationCount, listManagedProfiles } from "@/lib/business/queries";

export default async function SettingsPage() {
  const profile = await requireOwnerProfile();
  const [profiles, unreadCount] = await Promise.all([
    listManagedProfiles(),
    getUnreadNotificationCount(),
  ]);

  return (
    <AppShell profile={profile} unreadCount={unreadCount}>
      <div className="page-heading-row"><div><p className="eyebrow">Quản trị</p><h1>Cài đặt tài khoản</h1><p className="page-description">Quản lý tối đa hai người dùng và phân quyền truy cập.</p></div><Link className="secondary-link" href="/change-password">Đổi mật khẩu của tôi</Link></div>
      <section className="surface-card detail-section"><h2>Chủ tài khoản</h2><p><strong>{profile.display_name}</strong> · {profile.username}</p><p className="notes-copy">OWNER luôn hoạt động và không thể tự hạ quyền.</p></section>
      <UserManagement profiles={profiles} ownerId={profile.user_id} />
    </AppShell>
  );
}

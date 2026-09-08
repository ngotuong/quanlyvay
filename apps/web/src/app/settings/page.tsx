import { RenderRevision } from "@/components/app/render-revision";
import Link from "next/link";
import { KeyRound, SlidersHorizontal } from "lucide-react";
import { UserManagement } from "@/components/auth/user-management";
import { requireOwnerProfile } from "@/lib/auth/session";
import { listManagedProfiles } from "@/lib/business/queries";

export default async function SettingsPage() {
  const profile = await requireOwnerProfile();
  const profiles = await listManagedProfiles();

  return (
    <>
      <RenderRevision />
      <div className="page-heading-row"><div className="page-title-lockup"><span className="page-title-icon"><SlidersHorizontal size={24} strokeWidth={1.8} /></span><div><h1>Cài đặt tài khoản</h1></div></div><Link className="secondary-link" href="/change-password"><KeyRound size={18} />Đổi mật khẩu của tôi</Link></div>
      <section className="surface-card detail-section"><h2>Chủ tài khoản</h2><p><strong>{profile.display_name}</strong> · {profile.username}</p><p className="notes-copy">Chủ tài khoản luôn hoạt động và không thể tự hạ quyền.</p></section>
      <UserManagement profiles={profiles} ownerId={profile.user_id} />
    </>
  );
}

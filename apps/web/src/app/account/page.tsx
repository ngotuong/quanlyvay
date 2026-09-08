import Link from "next/link";
import { KeyRound, LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { requireAuthenticatedProfile } from "@/lib/auth/session";

export default async function AccountPage() {
  const profile = await requireAuthenticatedProfile();
  return <>
    <div className="page-heading-row"><div className="page-title-lockup"><UserRound /><h1>Tài khoản của tôi</h1></div></div>
    <section className="surface-card detail-section"><h2>{profile.display_name}</h2><p>{profile.username}</p>
      <Link className="secondary-link" href="/change-password"><KeyRound size={18} />Đổi mật khẩu của tôi</Link>
      <form action={logoutAction} className="account-logout"><button className="secondary-button" type="submit"><LogOut size={18} />Đăng xuất</button></form>
    </section>
  </>;
}

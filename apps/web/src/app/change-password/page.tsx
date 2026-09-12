import Image from "next/image";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireAuthenticatedProfile } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const profile = await requireAuthenticatedProfile({ allowPasswordChange: true });

  return (
    <main className="auth-page" id="main-content">
      <section className="single-auth-card" aria-labelledby="change-password-title">
        <div className="brand-mark brand-mark-small" aria-hidden="true">
          <Image src="/icons/brand-symbol-192.png" alt="" width={48} height={48} priority />
        </div>
        <p className="eyebrow">Tài khoản {profile.username}</p>
        <h1 id="change-password-title">
          {profile.must_change_password ? "Tạo mật khẩu riêng" : "Đổi mật khẩu"}
        </h1>
        <p className="auth-card-description">
          {profile.must_change_password
            ? "Đây là lần đăng nhập đầu tiên. Hãy thay mật khẩu tạm thời trước khi tiếp tục."
            : "Mật khẩu mới sẽ có hiệu lực ngay sau khi lưu."}
        </p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}

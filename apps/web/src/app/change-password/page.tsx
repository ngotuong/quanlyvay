import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireAuthenticatedProfile } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const profile = await requireAuthenticatedProfile({ allowPasswordChange: true });

  return (
    <main className="auth-page" id="main-content">
      <section className="single-auth-card" aria-labelledby="change-password-title">
        <div className="brand-mark brand-mark-small" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3 5.5 5.8v5.5c0 4.4 2.7 7.9 6.5 9.7 3.8-1.8 6.5-5.3 6.5-9.7V5.8L12 3Z" />
            <path d="M9.2 12.1 11 14l3.9-4.2" />
          </svg>
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

import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthenticatedProfile } from "@/lib/auth/session";

export default async function LoginPage() {
  const profile = await getAuthenticatedProfile();

  if (profile) {
    redirect(profile.must_change_password ? "/change-password" : "/");
  }

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-shell" aria-labelledby="login-title">
        <div className="auth-intro">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3 5.5 5.8v5.5c0 4.4 2.7 7.9 6.5 9.7 3.8-1.8 6.5-5.3 6.5-9.7V5.8L12 3Z" />
              <path d="M9.2 12.1 11 14l3.9-4.2" />
            </svg>
          </div>
          <p className="eyebrow">Quản lý vay cá nhân</p>
          <h1 id="login-title">Đăng nhập an toàn</h1>
          <p>
            Theo dõi khoản đi vay và cho vay trong một không gian riêng, chỉ dành cho các tài
            khoản đã được chủ hệ thống tạo.
          </p>
          <ul className="security-list" aria-label="Đặc điểm bảo mật">
            <li>Không có đăng ký công khai</li>
            <li>Phân quyền chủ tài khoản, biên tập và chỉ xem</li>
            <li>Phiên đăng nhập được xác minh trên máy chủ</li>
          </ul>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <h2>Chào mừng trở lại</h2>
            <p>Nhập tên đăng nhập và mật khẩu của bạn.</p>
          </div>
          <LoginForm />
          <p className="privacy-note">Thông tin đăng nhập không được lưu trong Google Sheets.</p>
        </div>
      </section>
    </main>
  );
}

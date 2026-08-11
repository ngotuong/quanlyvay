import Image from "next/image";
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
            <Image src="/icons/app-icon-192.png" alt="" width={64} height={64} priority />
          </div>
          <p className="eyebrow">Quản lý vay cá nhân</p>
          <h1 id="login-title">Đăng nhập an toàn</h1>
          <p>
            Theo dõi khoản đi vay và cho vay trong một không gian riêng, chỉ dành cho các tài
            khoản đã được chủ hệ thống tạo.
          </p>
        </div>

        <div className="auth-card">
          <div className="auth-card-heading">
            <h2>Chào mừng trở lại</h2>
            <p>Nhập tên đăng nhập và mật khẩu của bạn.</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

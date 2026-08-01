import { logoutAction } from "@/app/actions/auth";
import { requireAuthenticatedProfile } from "@/lib/auth/session";

const roleLabels = {
  OWNER: "Chủ tài khoản",
  EDITOR: "Biên tập",
  VIEWER: "Chỉ xem",
} as const;

export default async function HomePage() {
  const profile = await requireAuthenticatedProfile();

  return (
    <main className="session-page" id="main-content">
      <section className="session-card" aria-labelledby="welcome-title">
        <div className="brand-mark brand-mark-small" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3 5.5 5.8v5.5c0 4.4 2.7 7.9 6.5 9.7 3.8-1.8 6.5-5.3 6.5-9.7V5.8L12 3Z" />
            <path d="M9.2 12.1 11 14l3.9-4.2" />
          </svg>
        </div>
        <p className="eyebrow">Phiên đăng nhập local</p>
        <h1 id="welcome-title">Xin chào, {profile.display_name}</h1>
        <p className="session-description">
          Cơ chế xác thực và phân quyền đã sẵn sàng. Màn hình nghiệp vụ sẽ được xây dựng ở C6.
        </p>

        <dl className="profile-summary">
          <div>
            <dt>Tên đăng nhập</dt>
            <dd>{profile.username}</dd>
          </div>
          <div>
            <dt>Quyền hiện tại</dt>
            <dd>{roleLabels[profile.role]}</dd>
          </div>
        </dl>

        <form action={logoutAction}>
          <button className="secondary-button" type="submit">
            Đăng xuất
          </button>
        </form>
      </section>
    </main>
  );
}

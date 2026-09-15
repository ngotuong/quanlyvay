"use client";

import { useState, useTransition } from "react";
import {
  createManagedUser,
  manageUserProfile,
  resetManagedUserPassword,
} from "@/app/actions/user-admin";
import type { AppProfile } from "@/lib/auth/types";
import { captureRender, recoverUncommittedRender } from "@/lib/business/render-recovery.mjs";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/password-policy.mjs";

function Feedback({ message, ok }: { message: string; ok: boolean }) {
  return message ? <p className="action-message" data-success={ok} role="status">{message}</p> : null;
}

export function UserManagement({ profiles, ownerId }: { profiles: AppProfile[]; ownerId: string }) {
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState({ message: "", ok: false });
  const managedProfiles = profiles.filter((profile) => profile.user_id !== ownerId);
  const activeProfiles = managedProfiles.filter((profile) => profile.is_active);
  const inactiveProfiles = managedProfiles.filter((profile) => !profile.is_active);

  function submitCreate(formData: FormData) {
    const before = captureRender(document, window.location);
    startTransition(async () => {
      const result = await createManagedUser({
        username: formData.get("username"),
        displayName: formData.get("displayName"),
        role: formData.get("role"),
        temporaryPassword: formData.get("temporaryPassword"),
      });
      setFeedback({ ok: result.ok, message: result.ok ? "Đã tạo tài khoản." : result.message });
      if (result.ok) recoverUncommittedRender(before, { document, location: window.location });
    });
  }

  function submitProfile(formData: FormData) {
    const before = captureRender(document, window.location);
    const userId = formData.get("userId");
    startTransition(async () => {
      const result = await manageUserProfile({
        userId,
        displayName: formData.get("displayName"),
        role: formData.get("role"),
        isActive: formData.get("isActive") === "on",
      });
      setFeedback({ ok: result.ok, message: result.ok ? "Đã cập nhật tài khoản." : result.message });
      if (result.ok) recoverUncommittedRender(before, { document, location: window.location });
    });
  }

  function submitReset(formData: FormData) {
    const before = captureRender(document, window.location);
    const userId = formData.get("userId");
    startTransition(async () => {
      const result = await resetManagedUserPassword({
        userId,
        temporaryPassword: formData.get("temporaryPassword"),
      });
      setFeedback({ ok: result.ok, message: result.ok ? "Đã đặt mật khẩu tạm; người dùng phải đổi ở lần đăng nhập sau." : result.message });
      if (result.ok) recoverUncommittedRender(before, { document, location: window.location });
    });
  }

  function ProfileCard({ managed }: { managed: AppProfile }) {
    const fieldSuffix = managed.user_id;
    return <article className="managed-user-card" data-active={managed.is_active}>
      <div className="managed-user-summary">
        <div><h3>Tài khoản {managed.username}</h3><p>{managed.display_name} · {managed.role === "EDITOR" ? "Biên tập" : "Chỉ xem"}</p></div>
        <span className="managed-user-status" data-active={managed.is_active}>{managed.is_active ? "Đang hoạt động" : "Đã vô hiệu hóa"}</span>
      </div>
      <details className="managed-user-details">
        <summary>Quản lý tài khoản</summary>
        <form action={submitProfile} className="business-form compact-form">
          <input name="userId" type="hidden" value={managed.user_id} />
          <div className="field-group"><label htmlFor={`profile-display-name-${fieldSuffix}`}>Tên hiển thị</label><input id={`profile-display-name-${fieldSuffix}`} name="displayName" defaultValue={managed.display_name} maxLength={80} required /></div>
          <div className="field-group"><label htmlFor={`profile-role-${fieldSuffix}`}>Vai trò</label><select id={`profile-role-${fieldSuffix}`} name="role" defaultValue={managed.role}><option value="EDITOR">Biên tập</option><option value="VIEWER">Chỉ xem</option></select></div>
          <label className="checkbox-field"><input name="isActive" type="checkbox" defaultChecked={managed.is_active} /> Tài khoản đang hoạt động</label>
          <button className="primary-button" disabled={pending} type="submit">{pending ? "Đang lưu…" : "Lưu phân quyền"}</button>
        </form>
        <details className="managed-password-details">
          <summary>Đặt lại mật khẩu tạm</summary>
          <form action={submitReset} className="business-form compact-form">
            <input name="userId" type="hidden" value={managed.user_id} />
            <div className="field-group"><label htmlFor={`reset-password-${fieldSuffix}`}>Mật khẩu tạm mới</label><input id={`reset-password-${fieldSuffix}`} name="temporaryPassword" type="password" minLength={PASSWORD_MIN_LENGTH} pattern={PASSWORD_PATTERN} autoComplete="new-password" required /><p className="field-hint">{PASSWORD_REQUIREMENTS}</p></div>
            <button className="secondary-button" disabled={pending} type="submit">{pending ? "Đang đặt lại…" : "Đặt mật khẩu tạm"}</button>
          </form>
        </details>
      </details>
    </article>;
  }

  return (
    <section className="surface-card detail-section user-management-section" aria-labelledby="user-management-title">
      <div className="settings-section-heading"><p className="eyebrow">Dành cho chủ tài khoản</p><h2 id="user-management-title">Quản trị người dùng</h2><p>Tài khoản đang hoạt động được ưu tiên. Các tài khoản kỹ thuật cũ được thu gọn ở cuối danh sách.</p></div>
      <details className="create-user-details">
        <summary>Tạo tài khoản phụ</summary>
        <form action={submitCreate} className="business-form compact-form">
          <div className="field-group"><label htmlFor="managed-username">Tên đăng nhập</label><input id="managed-username" name="username" minLength={3} maxLength={32} required /></div>
          <div className="field-group"><label htmlFor="managed-display-name">Tên hiển thị</label><input id="managed-display-name" name="displayName" maxLength={80} required /></div>
          <div className="field-group"><label htmlFor="managed-role">Vai trò</label><select id="managed-role" name="role" defaultValue="EDITOR"><option value="EDITOR">Biên tập</option><option value="VIEWER">Chỉ xem</option></select></div>
          <div className="field-group"><label htmlFor="managed-password">Mật khẩu tạm</label><input id="managed-password" name="temporaryPassword" type="password" minLength={PASSWORD_MIN_LENGTH} pattern={PASSWORD_PATTERN} autoComplete="new-password" required /><p className="field-hint">{PASSWORD_REQUIREMENTS}</p></div>
          <button className="primary-button" disabled={pending} type="submit">{pending ? "Đang tạo…" : "Tạo tài khoản"}</button>
        </form>
      </details>
      <div className="managed-user-list" aria-label="Tài khoản phụ đang hoạt động">
        {activeProfiles.length ? activeProfiles.map((managed) => <ProfileCard key={managed.user_id} managed={managed} />) : <p className="empty-copy">Không có tài khoản phụ nào đang hoạt động.</p>}
      </div>
      {inactiveProfiles.length ? <details className="inactive-user-group">
        <summary>Tài khoản đã vô hiệu hóa ({inactiveProfiles.length})</summary>
        <p className="field-hint">Các tài khoản này không thể đăng nhập. Chúng được giữ lại để bảo toàn lịch sử và audit.</p>
        <div className="managed-user-list">{inactiveProfiles.map((managed) => <ProfileCard key={managed.user_id} managed={managed} />)}</div>
      </details> : null}
      <Feedback message={feedback.message} ok={feedback.ok} />
    </section>
  );
}

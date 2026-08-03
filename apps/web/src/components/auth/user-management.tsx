"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createManagedUser,
  manageUserProfile,
  resetManagedUserPassword,
} from "@/app/actions/user-admin";
import type { AppProfile } from "@/lib/auth/types";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/password-policy.mjs";

function Feedback({ message, ok }: { message: string; ok: boolean }) {
  return message ? <p className="action-message" data-success={ok} role="status">{message}</p> : null;
}

export function UserManagement({ profiles, ownerId }: { profiles: AppProfile[]; ownerId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState({ message: "", ok: false });
  const managed = profiles.find((profile) => profile.user_id !== ownerId);

  function submitCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createManagedUser({
        username: formData.get("username"),
        displayName: formData.get("displayName"),
        role: formData.get("role"),
        temporaryPassword: formData.get("temporaryPassword"),
      });
      setFeedback({ ok: result.ok, message: result.ok ? "Đã tạo tài khoản thứ hai." : result.message });
      if (result.ok) router.refresh();
    });
  }

  function submitProfile(formData: FormData) {
    if (!managed) return;
    startTransition(async () => {
      const result = await manageUserProfile({
        userId: managed.user_id,
        displayName: formData.get("displayName"),
        role: formData.get("role"),
        isActive: formData.get("isActive") === "on",
      });
      setFeedback({ ok: result.ok, message: result.ok ? "Đã cập nhật tài khoản." : result.message });
      if (result.ok) router.refresh();
    });
  }

  function submitReset(formData: FormData) {
    if (!managed) return;
    startTransition(async () => {
      const result = await resetManagedUserPassword({
        userId: managed.user_id,
        temporaryPassword: formData.get("temporaryPassword"),
      });
      setFeedback({ ok: result.ok, message: result.ok ? "Đã đặt mật khẩu tạm; người dùng phải đổi ở lần đăng nhập sau." : result.message });
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="detail-grid">
      {!managed ? (
        <section className="surface-card detail-section">
          <h2>Tạo tài khoản thứ hai</h2>
          <form action={submitCreate} className="business-form">
            <div className="field-group"><label htmlFor="managed-username">Tên đăng nhập</label><input id="managed-username" name="username" minLength={3} maxLength={32} required /></div>
            <div className="field-group"><label htmlFor="managed-display-name">Tên hiển thị</label><input id="managed-display-name" name="displayName" maxLength={80} required /></div>
            <div className="field-group"><label htmlFor="managed-role">Vai trò</label><select id="managed-role" name="role" defaultValue="EDITOR"><option value="EDITOR">Biên tập</option><option value="VIEWER">Chỉ xem</option></select></div>
            <div className="field-group"><label htmlFor="managed-password">Mật khẩu tạm</label><input id="managed-password" name="temporaryPassword" type="password" minLength={PASSWORD_MIN_LENGTH} pattern={PASSWORD_PATTERN} autoComplete="new-password" required /><p className="field-hint">{PASSWORD_REQUIREMENTS}</p></div>
            <button className="primary-button" disabled={pending} type="submit">{pending ? "Đang tạo…" : "Tạo tài khoản"}</button>
          </form>
        </section>
      ) : (
        <>
          <section className="surface-card detail-section">
            <h2>Tài khoản {managed.username}</h2>
            <form action={submitProfile} className="business-form">
              <div className="field-group"><label htmlFor="profile-display-name">Tên hiển thị</label><input id="profile-display-name" name="displayName" defaultValue={managed.display_name} maxLength={80} required /></div>
              <div className="field-group"><label htmlFor="profile-role">Vai trò</label><select id="profile-role" name="role" defaultValue={managed.role}><option value="EDITOR">Biên tập</option><option value="VIEWER">Chỉ xem</option></select></div>
              <label className="checkbox-field"><input name="isActive" type="checkbox" defaultChecked={managed.is_active} /> Tài khoản đang hoạt động</label>
              <button className="primary-button" disabled={pending} type="submit">{pending ? "Đang lưu…" : "Lưu phân quyền"}</button>
            </form>
          </section>
          <section className="surface-card detail-section">
            <h2>Đặt lại mật khẩu</h2>
            <form action={submitReset} className="business-form">
              <div className="field-group"><label htmlFor="reset-password">Mật khẩu tạm mới</label><input id="reset-password" name="temporaryPassword" type="password" minLength={PASSWORD_MIN_LENGTH} pattern={PASSWORD_PATTERN} autoComplete="new-password" required /><p className="field-hint">{PASSWORD_REQUIREMENTS}</p></div>
              <button className="secondary-button" disabled={pending} type="submit">{pending ? "Đang đặt lại…" : "Đặt mật khẩu tạm"}</button>
            </form>
          </section>
        </>
      )}
      <Feedback message={feedback.message} ok={feedback.ok} />
    </div>
  );
}

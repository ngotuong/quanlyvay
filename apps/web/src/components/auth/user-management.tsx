"use client";

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createManagedUser, manageUserProfile, resetManagedUserPassword, type UserAdminResult } from "@/app/actions/user-admin";
import type { AppProfile } from "@/lib/auth/types";
import { PASSWORD_MIN_LENGTH, PASSWORD_PATTERN, PASSWORD_REQUIREMENTS } from "@/lib/auth/password-policy.mjs";
import { BusinessForm, ActionMessage } from "@/components/business/form-parts";
import { useBusinessAction } from "@/components/business/use-business-action";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { notifyToast } from "@/components/ui";

type Draft = { dirty: boolean; pending: boolean };
type DraftContext = { update: (id: string, draft: Draft | null) => void; complete: (id: string, message: string) => void; announce: (message: string) => void };
const AccountDrafts = createContext<DraftContext>({ update: () => {}, complete: () => {}, announce: () => {} });

function AccountDetails({ children, label, className }: { children: ReactNode; label: string; className: string }) {
  const parent = useContext(AccountDrafts);
  const ref = useRef<HTMLDetailsElement>(null);
  const drafts = useRef(new Map<string, Draft>());
  const [session, setSession] = useState(0);
  const context = useMemo<DraftContext>(() => ({
    update(id, draft) {
      if (draft) drafts.current.set(id, draft); else drafts.current.delete(id);
      parent.update(id, draft);
    },
    complete(id, message) {
      const others = [...drafts.current].some(([key, value]) => key !== id && (value.dirty || value.pending));
      if (!others) {
        ref.current?.removeAttribute("open");
        setSession(value => value + 1);
        ref.current?.querySelector("summary")?.focus();
      }
      notifyToast(message, "success");
      parent.announce(message);
    },
    announce: parent.announce,
  }), [parent]);
  return <details ref={ref} className={className}><summary onClick={event => {
    if (!ref.current?.open) return;
    if ([...drafts.current.values()].some(value => value.pending)) {
      event.preventDefault(); notifyToast("Đang lưu thay đổi. Vui lòng chờ kết quả."); return;
    }
    if ([...drafts.current.values()].some(value => value.dirty)) {
      if (!window.confirm("Bạn có thay đổi chưa lưu. Đóng và bỏ các thay đổi này?")) { event.preventDefault(); return; }
      setSession(value => value + 1);
    }
  }}>{label}</summary><AccountDrafts.Provider value={context}><div key={session}>{children}</div></AccountDrafts.Provider></details>;
}

function AccountForm({ children, submit, success, button, className = "primary-button" }: {
  children: ReactNode; submit: (data: FormData) => Promise<UserAdminResult>; success: string; button: string; className?: string;
}) {
  const drafts = useContext(AccountDrafts);
  const id = useId();
  const current = useRef<Draft>({ dirty: false, pending: false });
  const [state, action] = useBusinessAction(async (_state, data) => {
    drafts.announce("");
    const result = await submit(data);
    return { ok: result.ok, message: result.ok ? success : result.message };
  }, initialBusinessActionState);
  const onDirtyChange = useCallback((dirty: boolean) => { current.current.dirty = dirty; drafts.update(id, { ...current.current }); }, [drafts, id]);
  const onPendingChange = useCallback((pending: boolean) => { current.current.pending = pending; drafts.update(id, { ...current.current }); }, [drafts, id]);
  useEffect(() => () => drafts.update(id, null), [drafts, id]);
  return <BusinessForm action={action} state={state} className="business-form compact-form" onDirtyChange={onDirtyChange} onPendingChange={onPendingChange} onSuccess={message => drafts.complete(id, message)}>
    {children}<ActionMessage state={state} /><button className={className} disabled={state.pending} type="submit">{state.pending ? "Đang lưu…" : button}</button>
  </BusinessForm>;
}

function ProfileCard({ managed }: { managed: AppProfile }) {
  const fieldSuffix = managed.user_id;
  return <article className="managed-user-card" data-active={managed.is_active}>
    <div className="managed-user-summary">
      <div><h3>Tài khoản {managed.username}</h3><p>{managed.display_name} · {managed.role === "EDITOR" ? "Biên tập" : "Chỉ xem"}</p></div>
      <span className="managed-user-status" data-active={managed.is_active}>{managed.is_active ? "Đang hoạt động" : "Đã vô hiệu hóa"}</span>
    </div>
    <AccountDetails className="managed-user-details" label="Quản lý tài khoản">
      <AccountForm submit={data => manageUserProfile({ userId: data.get("userId"), displayName: data.get("displayName"), role: data.get("role"), isActive: data.get("isActive") === "on" })} success="Đã cập nhật tài khoản." button="Lưu phân quyền">
        <input name="userId" type="hidden" value={managed.user_id} />
        <div className="field-group"><label htmlFor={`profile-display-name-${fieldSuffix}`}>Tên hiển thị</label><input key={managed.display_name} id={`profile-display-name-${fieldSuffix}`} name="displayName" defaultValue={managed.display_name} maxLength={80} required /></div>
        <div className="field-group"><label htmlFor={`profile-role-${fieldSuffix}`}>Vai trò</label><select key={managed.role} id={`profile-role-${fieldSuffix}`} name="role" defaultValue={managed.role}><option value="EDITOR">Biên tập</option><option value="VIEWER">Chỉ xem</option></select></div>
        <label className="checkbox-field"><input key={String(managed.is_active)} name="isActive" type="checkbox" defaultChecked={managed.is_active} /> Tài khoản đang hoạt động</label>
      </AccountForm>
      <AccountDetails className="managed-password-details" label="Đặt lại mật khẩu tạm">
        <AccountForm submit={data => resetManagedUserPassword({ userId: data.get("userId"), temporaryPassword: data.get("temporaryPassword") })} success="Đã đặt mật khẩu tạm; người dùng phải đổi ở lần đăng nhập sau." button="Đặt mật khẩu tạm" className="secondary-button">
          <input name="userId" type="hidden" value={managed.user_id} />
          <div className="field-group"><label htmlFor={`reset-password-${fieldSuffix}`}>Mật khẩu tạm mới</label><input id={`reset-password-${fieldSuffix}`} name="temporaryPassword" type="password" minLength={PASSWORD_MIN_LENGTH} pattern={PASSWORD_PATTERN} autoComplete="new-password" required /><p className="field-hint">{PASSWORD_REQUIREMENTS}</p></div>
        </AccountForm>
      </AccountDetails>
    </AccountDetails>
  </article>;
}

export function UserManagement({ profiles, ownerId }: { profiles: AppProfile[]; ownerId: string }) {
  const [successMessage, setSuccessMessage] = useState("");
  const root = useMemo<DraftContext>(() => ({ update: () => {}, complete: () => {}, announce: setSuccessMessage }), []);
  const managedProfiles = profiles.filter(profile => profile.user_id !== ownerId);
  const activeProfiles = managedProfiles.filter(profile => profile.is_active);
  const inactiveProfiles = managedProfiles.filter(profile => !profile.is_active);
  return (
    <AccountDrafts.Provider value={root}><section className="surface-card detail-section user-management-section" aria-labelledby="user-management-title">
      <div className="settings-section-heading"><p className="eyebrow">Dành cho chủ tài khoản</p><h2 id="user-management-title">Quản trị người dùng</h2><p>Tài khoản đang hoạt động được ưu tiên. Các tài khoản kỹ thuật cũ được thu gọn ở cuối danh sách.</p></div>
      <AccountDetails className="create-user-details" label="Tạo tài khoản phụ">
        <AccountForm submit={data => createManagedUser({ username: data.get("username"), displayName: data.get("displayName"), role: data.get("role"), temporaryPassword: data.get("temporaryPassword") })} success="Đã tạo tài khoản." button="Tạo tài khoản">
          <div className="field-group"><label htmlFor="managed-username">Tên đăng nhập</label><input id="managed-username" name="username" minLength={3} maxLength={32} required /></div>
          <div className="field-group"><label htmlFor="managed-display-name">Tên hiển thị</label><input id="managed-display-name" name="displayName" maxLength={80} required /></div>
          <div className="field-group"><label htmlFor="managed-role">Vai trò</label><select id="managed-role" name="role" defaultValue="EDITOR"><option value="EDITOR">Biên tập</option><option value="VIEWER">Chỉ xem</option></select></div>
          <div className="field-group"><label htmlFor="managed-password">Mật khẩu tạm</label><input id="managed-password" name="temporaryPassword" type="password" minLength={PASSWORD_MIN_LENGTH} pattern={PASSWORD_PATTERN} autoComplete="new-password" required /><p className="field-hint">{PASSWORD_REQUIREMENTS}</p></div>
        </AccountForm>
      </AccountDetails>
      <div className="managed-user-list" aria-label="Tài khoản phụ đang hoạt động">
        {activeProfiles.length ? activeProfiles.map((managed) => <ProfileCard key={managed.user_id} managed={managed} />) : <p className="empty-copy">Không có tài khoản phụ nào đang hoạt động.</p>}
      </div>
      {inactiveProfiles.length ? <AccountDetails className="inactive-user-group" label={`Tài khoản đã vô hiệu hóa (${inactiveProfiles.length})`}>
        <p className="field-hint">Các tài khoản này không thể đăng nhập. Chúng được giữ lại để bảo toàn lịch sử và audit.</p>
        <div className="managed-user-list">{inactiveProfiles.map((managed) => <ProfileCard key={managed.user_id} managed={managed} />)}</div>
      </AccountDetails> : null}
      {successMessage ? <p className="action-message" data-success="true" aria-live="off">{successMessage}</p> : null}
    </section></AccountDrafts.Provider>
  );
}

"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions/auth";
import type { AuthActionState } from "@/lib/auth/types";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

const initialState: AuthActionState = { status: "idle" };

export function ChangePasswordForm() {
  const [state, formAction] = useActionState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="auth-form" noValidate>
      <PasswordField
        id="new-password"
        name="password"
        label="Mật khẩu mới"
        autoComplete="new-password"
        error={state.fieldErrors?.password?.[0]}
      />
      <PasswordField
        id="confirm-password"
        name="confirmPassword"
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword?.[0]}
      />

      <p className="password-requirements">
        Dùng ít nhất 10 ký tự, có chữ hoa, chữ thường và chữ số.
      </p>

      {state.message ? (
        <div className="form-message form-message-error" role="alert" aria-live="polite">
          {state.message}
        </div>
      ) : null}

      <SubmitButton idleLabel="Lưu mật khẩu mới" pendingLabel="Đang cập nhật…" />
    </form>
  );
}

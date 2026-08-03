"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/app/actions/auth";
import type { AuthActionState } from "@/lib/auth/types";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  PASSWORD_REQUIREMENTS,
} from "@/lib/auth/password-policy.mjs";
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
        minLength={PASSWORD_MIN_LENGTH}
        pattern={PASSWORD_PATTERN}
        error={state.fieldErrors?.password?.[0]}
      />
      <PasswordField
        id="confirm-password"
        name="confirmPassword"
        label="Nhập lại mật khẩu mới"
        autoComplete="new-password"
        minLength={PASSWORD_MIN_LENGTH}
        pattern={PASSWORD_PATTERN}
        error={state.fieldErrors?.confirmPassword?.[0]}
      />

      <p className="password-requirements">
        {PASSWORD_REQUIREMENTS}
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

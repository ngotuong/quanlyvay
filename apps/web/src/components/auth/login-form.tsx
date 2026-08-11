"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import type { AuthActionState } from "@/lib/auth/types";
import { PasswordField } from "./password-field";
import { SubmitButton } from "./submit-button";

const initialState: AuthActionState = { status: "idle" };

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);
  const usernameError = state.fieldErrors?.username?.[0];
  const passwordError = state.fieldErrors?.password?.[0];

  return (
    <form action={formAction} className="auth-form" noValidate>
      <div className="field-group">
        <label htmlFor="username">Tên đăng nhập</label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          minLength={3}
          maxLength={32}
          aria-invalid={Boolean(usernameError)}
          aria-describedby={usernameError ? "username-error" : undefined}
        />
        {usernameError ? (
          <p id="username-error" className="field-error" role="alert">
            {usernameError}
          </p>
        ) : null}
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Mật khẩu"
        autoComplete="current-password"
        error={passwordError}
      />

      {state.message ? (
        <div className="form-message form-message-error" role="alert" aria-live="polite">
          {state.message}
        </div>
      ) : null}

      <SubmitButton idleLabel="Đăng nhập" pendingLabel="Đang kiểm tra…" />
    </form>
  );
}

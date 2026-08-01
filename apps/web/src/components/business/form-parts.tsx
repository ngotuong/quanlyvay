"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";
import type { BusinessActionState } from "@/lib/business/action-state";

export function FieldError({ state, name }: { state: BusinessActionState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  return message ? <p className="field-error" role="alert">{message}</p> : null;
}

export function ActionMessage({ state }: { state: BusinessActionState }) {
  if (!state.message) return null;
  return <p className="action-message" data-success={state.ok} role="status" aria-live="polite">{state.message}</p>;
}

export function FormSubmit({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={danger ? "danger-button" : "primary-button"} disabled={pending} type="submit">
      {pending ? <LoaderCircle className="spin" aria-hidden="true" size={18} /> : null}
      {pending ? "Đang lưu…" : children}
    </button>
  );
}

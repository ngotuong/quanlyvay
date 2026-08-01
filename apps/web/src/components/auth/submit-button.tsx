"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? <span className="spinner" aria-hidden="true" /> : null}
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}

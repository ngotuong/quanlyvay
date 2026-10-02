"use client";

import { createContext, useContext, useEffect, useId, useRef, useSyncExternalStore, type ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import type { BusinessActionState } from "@/lib/business/action-state";
import { Button, notifyToast } from "@/components/ui";

import { registerDraft } from "@/components/app/dirty-navigation-guard";

const BusinessPending = createContext(false);
const ManagedSuccess = createContext(false);
const subscribeHydration = () => () => {};

function focusField(form: HTMLFormElement | null | undefined, name: string) {
  const proxy = form?.querySelector<HTMLElement>(`[data-field-name="${CSS.escape(name)}"]`);
  if (proxy) { proxy.focus(); return; }
  const field = form?.elements.namedItem(name);
  if (field instanceof HTMLElement) field.focus();
  else if (field instanceof RadioNodeList && field[0] instanceof HTMLElement) field[0].focus();
}

export function FieldError({ state, name }: { state: BusinessActionState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const controls = ref.current?.closest("form")?.querySelectorAll(`[name="${CSS.escape(name)}"], [data-field-name="${CSS.escape(name)}"]`) ?? [];
    for (const input of controls) {
    input.setAttribute("aria-invalid", String(Boolean(message)));
    const descriptions = (input.getAttribute("aria-describedby") ?? "").split(" ").filter(value => value && value !== id);
    if (message) descriptions.push(id);
    if (descriptions.length) input.setAttribute("aria-describedby", descriptions.join(" "));
    else input.removeAttribute("aria-describedby");
    }
  }, [message, name, id]);
  return <p ref={ref} id={id} className="field-error" role={message ? "alert" : undefined} hidden={!message}>{message}</p>;
}

export type BusinessFormProps = Omit<ComponentProps<"form">, "action"> & {
  state: BusinessActionState & { pending?: boolean };
  action: (data: FormData) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
  onSuccess?: (message: string) => void;
};

export function BusinessForm({ state, children, action, onDirtyChange, onPendingChange, onSuccess, ...props }: BusinessFormProps) {
  const interactive = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const ref = useRef<HTMLFormElement>(null);
  const dirty = useRef(false);
  const handledSubmission = useRef(0);
  useEffect(() => {
    if (!state.submissionId || handledSubmission.current === state.submissionId || !state.message || state.pending) return;
    handledSubmission.current = state.submissionId;
    if (state.ok) {
      dirty.current = false;
      onDirtyChange?.(false);
      ref.current?.reset();
      onSuccess?.(state.message);
      return;
    }
    const form = ref.current;
    if (!form) return;
    const firstName = Object.keys(state.fieldErrors ?? {})[0];
    if (firstName) focusField(form, firstName);
    else form.querySelector<HTMLElement>(".action-message")?.focus();
  }, [onDirtyChange, onSuccess, state.fieldErrors, state.message, state.ok, state.pending, state.submissionId]);
  useEffect(() => { onPendingChange?.(Boolean(state.pending)); }, [onPendingChange, state.pending]);
  useEffect(() => registerDraft(() => dirty.current), []);
  return <ManagedSuccess.Provider value={Boolean(onSuccess)}><BusinessPending.Provider value={Boolean(state.pending)}><form {...props} ref={ref} aria-busy={Boolean(state.pending)} onChange={event => {
    if (!dirty.current) onDirtyChange?.(true);
    dirty.current = true;
    props.onChange?.(event);
  }} onSubmit={(event) => {
    props.onSubmit?.(event);
    const cancelled = event.defaultPrevented;
    event.preventDefault();
    if (!cancelled && !state.pending) action(new FormData(event.currentTarget));
  }}><fieldset className="business-form-fields" disabled={!interactive || Boolean(state.pending)}>{children}</fieldset></form></BusinessPending.Provider></ManagedSuccess.Provider>;
}

export function ActionMessage({ state, hiddenFields = [] }: { state: BusinessActionState; hiddenFields?: string[] }) {
  const managed = useContext(ManagedSuccess);
  const announced = useRef<number | string | null>(null);
  useEffect(() => {
    const identity = state.submissionId ?? state.message;
    if (managed || !state.ok || !state.message || announced.current === identity) return;
    announced.current = identity;
    notifyToast(state.message, "success");
  }, [managed, state.message, state.ok, state.submissionId]);
  if (!state.message) return null;
  return <div className="action-message" tabIndex={-1} data-success={state.ok} role={state.ok ? undefined : "status"} aria-live={state.ok ? "off" : "polite"}><p>{state.message}</p>
    {state.fieldErrors ? <ul>{Object.entries(state.fieldErrors).filter(([name]) => !hiddenFields.includes(name)).flatMap(([name, errors]) => errors.map(message => <li key={`${name}-${message}`}><button type="button" className="error-field-link" onClick={event => {
      focusField(event.currentTarget.closest("form"), name);
    }}>{message}</button></li>))}</ul> : null}
  </div>;
}

export function FormSubmit({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  const pending = useContext(BusinessPending);
  return (
    <Button variant={danger ? "danger" : "primary"} className={danger ? "danger-button" : "primary-button"} disabled={pending} type="submit">
      {pending ? <LoaderCircle className="spin" aria-hidden="true" size={18} /> : null}
      {pending ? "Đang lưu…" : children}
    </Button>
  );
}

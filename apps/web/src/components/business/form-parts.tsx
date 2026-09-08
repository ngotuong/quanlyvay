"use client";

import { createContext, useContext, useEffect, useId, useRef, useSyncExternalStore, type ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import type { BusinessActionState } from "@/lib/business/action-state";

const BusinessPending = createContext(false);
const subscribeHydration = () => () => {};

function focusField(form: HTMLFormElement | null | undefined, name: string) {
  const field = form?.elements.namedItem(name);
  if (field instanceof HTMLElement) field.focus();
  else if (field instanceof RadioNodeList && field[0] instanceof HTMLElement) field[0].focus();
}

export function FieldError({ state, name }: { state: BusinessActionState; name: string }) {
  const message = state.fieldErrors?.[name]?.[0];
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const controls = ref.current?.closest("form")?.querySelectorAll(`[name="${CSS.escape(name)}"]`) ?? [];
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

export function BusinessForm({ state, children, action, ...props }: Omit<ComponentProps<"form">, "action"> & { state: BusinessActionState & { pending?: boolean }; action: (data: FormData) => void }) {
  const interactive = useSyncExternalStore(subscribeHydration, () => true, () => false);
  const ref = useRef<HTMLFormElement>(null);
  const dirty = useRef(false);
  useEffect(() => {
    if (!state.message || state.pending) return;
    if (state.ok) { dirty.current = false; ref.current?.reset(); return; }
    const form = ref.current;
    if (!form) return;
    const firstName = Object.keys(state.fieldErrors ?? {})[0];
    if (firstName) focusField(form, firstName);
  }, [state]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", beforeUnload);
    const navigation = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (dirty.current && link && link.getAttribute("href")?.startsWith("/") && !window.confirm("Bạn có thay đổi chưa lưu. Rời trang và bỏ các thay đổi này?")) {
        event.preventDefault(); event.stopPropagation();
      }
    };
    document.addEventListener("click", navigation, true);
    return () => { window.removeEventListener("beforeunload", beforeUnload); document.removeEventListener("click", navigation, true); };
  }, []);
  return <BusinessPending.Provider value={Boolean(state.pending)}><form {...props} ref={ref} onChange={event => { dirty.current = true; props.onChange?.(event); }} onSubmit={(event) => {
    props.onSubmit?.(event);
    const cancelled = event.defaultPrevented;
    event.preventDefault();
    if (!cancelled && !state.pending) action(new FormData(event.currentTarget));
  }}><fieldset className="business-form-fields" disabled={!interactive || Boolean(state.pending)}>{children}</fieldset></form></BusinessPending.Provider>;
}

export function ActionMessage({ state, hiddenFields = [] }: { state: BusinessActionState; hiddenFields?: string[] }) {
  if (!state.message) return null;
  return <div className="action-message" data-success={state.ok} role="status" aria-live="polite"><p>{state.message}</p>
    {state.fieldErrors ? <ul>{Object.entries(state.fieldErrors).filter(([name]) => !hiddenFields.includes(name)).flatMap(([name, errors]) => errors.map(message => <li key={`${name}-${message}`}><button type="button" className="error-field-link" onClick={event => {
      focusField(event.currentTarget.closest("form"), name);
    }}>{message}</button></li>))}</ul> : null}
  </div>;
}

export function FormSubmit({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  const pending = useContext(BusinessPending);
  return (
    <button className={danger ? "danger-button" : "primary-button"} disabled={pending} type="submit">
      {pending ? <LoaderCircle className="spin" aria-hidden="true" size={18} /> : null}
      {pending ? "Đang lưu…" : children}
    </button>
  );
}

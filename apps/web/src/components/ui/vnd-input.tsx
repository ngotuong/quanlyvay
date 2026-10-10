"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject, type ComponentPropsWithoutRef } from "react";
import { formatVndDigits, normalizeVnd } from "@/lib/business/vnd.mjs";
import { addQuickVnd, PRINCIPAL_QUICK_AMOUNTS } from "@/lib/business/quick-vnd.mjs";
import { Button } from "./button";
import { cx } from "./utils";

type VndInputProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "inputMode" | "value" | "defaultValue" | "onChange"> & {
  defaultValue?: string | number;
  onValueChange?: (normalizedValue: string) => void;
  quickAmounts?: { maximumVnd?: string };
  suggestedAmountVnd?: string;
};

function applyInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (!setter) return false;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus({ preventScroll: true });
  input.setSelectionRange(value.length, value.length);
  return true;
}

export function formatVndInput(value: string | number) {
  const digits = normalizeVnd(value);
  return /^\d*$/.test(digits) ? formatVndDigits(digits) : String(value);
}

export function VndInput({ className, defaultValue = "", onValueChange, quickAmounts, suggestedAmountVnd, ...props }: VndInputProps) {
  const [value, setValue] = useState(() => formatVndInput(defaultValue));
  const inputRef = useRef<HTMLInputElement>(null);
  const selection = useRef<number | null>(null);
  const clearQuickError = useRef<(() => void) | null>(null);

  useEffect(() => {
    const form = inputRef.current?.form;
    const reset = () => {
      const initial = formatVndInput(defaultValue);
      inputRef.current?.setCustomValidity("");
      clearQuickError.current?.();
      selection.current = null;
      setValue(initial);
      onValueChange?.(normalizeVnd(initial));
    };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue, onValueChange]);

  useLayoutEffect(() => {
    if (selection.current !== null) inputRef.current?.setSelectionRange(selection.current, selection.current);
    selection.current = null;
  }, [value]);

  const input = <input {...props} className={cx("ui-input", className)} ref={inputRef} type="text" inputMode="numeric" value={value} pattern="[0-9]+(\.[0-9]{3})*"
    onKeyDown={(event) => { if ([".", ",", "-", "+"].includes(event.key)) event.preventDefault(); }}
    onPaste={(event) => {
      const text = event.clipboardData.getData("text");
      if (!/^\d+$/.test(normalizeVnd(text))) {
        event.preventDefault();
        event.currentTarget.setCustomValidity("Nhập số nguyên VND dương, ví dụ 1.000.000. Không dùng dấu âm hoặc phần thập phân.");
        event.currentTarget.reportValidity();
      }
    }}
    onChange={(event) => {
      const input = event.currentTarget;
      const raw = input.value;
      clearQuickError.current?.();
      input.setCustomValidity("");
      if (!/^[\d.]*$/.test(raw)) { setValue(raw); onValueChange?.(raw); return; }
      const digitsBefore = raw.slice(0, input.selectionStart ?? raw.length).replaceAll(".", "").length;
      const formatted = formatVndDigits(raw.replaceAll(".", ""));
      let cursor = 0;
      let digits = 0;
      while (cursor < formatted.length && digits < digitsBefore) { if (/\d/.test(formatted[cursor])) digits++; cursor++; }
      selection.current = cursor;
      input.value = formatted;
      input.setSelectionRange(cursor, cursor);
      setValue(formatted);
      onValueChange?.(formatted.replaceAll(".", ""));
    }} />;
  return <>{input}{suggestedAmountVnd && /^\d+$/.test(suggestedAmountVnd) && BigInt(suggestedAmountVnd) > BigInt(0) ? <Button variant="secondary" type="button" disabled={props.disabled || props.readOnly} className="payment-balance-suggestion" onClick={() => {
    const input = inputRef.current;
    if (input && !input.matches(":disabled") && !input.readOnly) applyInputValue(input, formatVndDigits(suggestedAmountVnd));
  }}>Theo số còn lại</Button> : null}{quickAmounts ? <QuickAmounts key={quickAmounts.maximumVnd ?? "system"} inputRef={inputRef} clearErrorRef={clearQuickError} maximumVnd={quickAmounts.maximumVnd} disabled={props.disabled || props.readOnly} /> : null}</>;
}

function QuickAmounts({ inputRef, clearErrorRef, maximumVnd, disabled }: { inputRef: RefObject<HTMLInputElement | null>; clearErrorRef: RefObject<(() => void) | null>; maximumVnd?: string; disabled?: boolean }) {
  const [error, setError] = useState("");
  const errorId = useId();
  useEffect(() => {
    // Clear inside VndInput's React change/reset path. A native input listener can
    // render the old controlled value before React has consumed the user's edit.
    const clear = () => setError("");
    clearErrorRef.current = clear;
    return () => { if (clearErrorRef.current === clear) clearErrorRef.current = null; };
  }, [clearErrorRef]);
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const remove = () => {
      const ids = (input.getAttribute("aria-describedby") ?? "").split(" ").filter(id => id && id !== errorId);
      if (ids.length) input.setAttribute("aria-describedby", ids.join(" "));
      else input.removeAttribute("aria-describedby");
    };
    remove();
    if (error) input.setAttribute("aria-describedby", [input.getAttribute("aria-describedby"), errorId].filter(Boolean).join(" "));
    return remove;
  }, [error, errorId, inputRef]);

  function apply(increment: string) {
    const input = inputRef.current;
    if (!input || input.matches(":disabled") || input.readOnly) return;
    const result = addQuickVnd(input.value, increment, maximumVnd);
    if (!result.ok) { setError(result.error); input.focus({ preventScroll: true }); input.setSelectionRange(input.value.length, input.value.length); return; }
    // React's normal change path updates display/callback and BusinessForm's dirty guard once.
    setError("");
    if (!applyInputValue(input, result.formattedValue)) setError("Không thể cập nhật ô nhập. Hãy nhập số tiền trực tiếp.");
  }
  return <><div className="vnd-quick-amounts" role="group" aria-label="Nhập nhanh tiền gốc">{PRINCIPAL_QUICK_AMOUNTS.map(({ amount, label, accessibleLabel }) => <Button key={amount} variant="secondary" type="button" disabled={disabled} aria-label={accessibleLabel} onClick={() => apply(amount)}>{label}</Button>)}</div>{error ? <p id={errorId} className="field-error quick-amount-error" role="alert">{error}</p> : null}</>;
}

"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { formatVndDigits, normalizeVnd } from "@/lib/business/vnd.mjs";
import { cx } from "./utils";

type VndInputProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "inputMode" | "value" | "defaultValue" | "onChange"> & {
  defaultValue?: string | number;
  onValueChange?: (normalizedValue: string) => void;
};

export function formatVndInput(value: string | number) {
  const digits = normalizeVnd(value);
  return /^\d*$/.test(digits) ? formatVndDigits(digits) : String(value);
}

export function VndInput({ className, defaultValue = "", onValueChange, ...props }: VndInputProps) {
  const [value, setValue] = useState(() => formatVndInput(defaultValue));
  const inputRef = useRef<HTMLInputElement>(null);
  const selection = useRef<number | null>(null);

  useEffect(() => {
    const form = inputRef.current?.form;
    const reset = () => setValue(formatVndInput(defaultValue));
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [defaultValue]);

  useLayoutEffect(() => {
    if (selection.current !== null) inputRef.current?.setSelectionRange(selection.current, selection.current);
    selection.current = null;
  }, [value]);

  return <input {...props} className={cx("ui-input", className)} ref={inputRef} type="text" inputMode="numeric" value={value} pattern="[0-9]+(\.[0-9]{3})*"
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
      input.setCustomValidity("");
      if (!/^[\d.]*$/.test(raw)) { setValue(raw); return; }
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
}

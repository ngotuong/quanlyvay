"use client";

import { forwardRef, useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes, type Ref } from "react";
import { formatDate } from "@/lib/business/format";
import { cx } from "./utils";

type DateInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

function setRef<T>(ref: Ref<T> | undefined, value: T) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

function normalizedValue(value: DateInputProps["value"] | DateInputProps["defaultValue"]) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(function DateInput({ className, defaultValue, value, onChange, ...props }, forwardedRef) {
  const controlled = value !== undefined;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const initialValue = normalizedValue(defaultValue);
  const [internalValue, setInternalValue] = useState(initialValue);
  const currentValue = controlled ? normalizedValue(value) : internalValue;

  useEffect(() => {
    const input = inputRef.current;
    const form = input?.form;
    if (!input || !form || controlled) return;
    const handleReset = () => requestAnimationFrame(() => setInternalValue(input.defaultValue));
    form.addEventListener("reset", handleReset);
    return () => form.removeEventListener("reset", handleReset);
  }, [controlled]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    if (!controlled) setInternalValue(event.target.value);
    onChange?.(event);
  }

  return (
    <span className={cx("ui-date-input", className)} data-empty={!currentValue}>
      <span className="ui-date-input-value" aria-hidden="true">{currentValue ? formatDate(currentValue) : "dd/mm/yyyy"}</span>
      <input
        {...props}
        ref={(node) => {
          inputRef.current = node;
          setRef(forwardedRef, node);
        }}
        type="date"
        value={currentValue}
        onChange={handleChange}
      />
    </span>
  );
});

"use client";

import { useState, type ComponentPropsWithoutRef } from "react";

type VndInputProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "inputMode" | "value" | "defaultValue" | "onChange"
> & {
  defaultValue?: string | number;
};

export function formatVndInput(value: string | number) {
  const digits = String(value).replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function VndInput({ defaultValue = "", ...props }: VndInputProps) {
  const [value, setValue] = useState(() => formatVndInput(defaultValue));

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(event) => setValue(formatVndInput(event.target.value))}
    />
  );
}

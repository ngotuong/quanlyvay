import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cx } from "./utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export function buttonClassName(variant: ButtonVariant = "primary", className?: string) {
  return cx("ui-button", `ui-button--${variant}`, className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(
  function Button({ className, variant = "primary", type = "button", ...props }, ref) {
    return <button ref={ref} type={type} className={buttonClassName(variant, className)} {...props} />;
  },
);

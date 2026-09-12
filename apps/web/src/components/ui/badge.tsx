import type { HTMLAttributes } from "react";
import { cx } from "./utils";

export type BadgeTone = "neutral" | "primary" | "success" | "warning" | "danger" | "lending" | "borrowing";

export function Badge({ className, tone = "neutral", ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cx("ui-badge", `ui-badge--${tone}`, className)} {...props} />;
}

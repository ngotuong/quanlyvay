import type { HTMLAttributes } from "react";
import { cx } from "./utils";

/** Existing scroll container; consumers own headers, rows, privacy and table semantics. */
export function ResponsiveTable({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("table-scroll", className)} {...props} />;
}

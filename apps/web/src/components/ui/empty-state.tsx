import type { HTMLAttributes } from "react";
import { cx } from "./utils";

type EmptyStateProps = HTMLAttributes<HTMLElement> & { as?: "section" | "div" };

/** Layout only: each consumer keeps its empty/search/unread/error message and semantics. */
export function EmptyState({ as = "section", className, ...props }: EmptyStateProps) {
  const classes = cx("empty-state", className);
  return as === "div" ? <div className={classes} {...props} /> : <section className={classes} {...props} />;
}

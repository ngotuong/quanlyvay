import type { HTMLAttributes } from "react";
import { cx } from "./utils";

export type CardVariant = "flat" | "interactive" | "metric" | "alert";

type CardProps = HTMLAttributes<HTMLElement> & { as?: "section" | "article" | "div"; variant?: CardVariant };

export function Card({ as = "section", className, variant = "flat", ...props }: CardProps) {
  const classes = cx("ui-card", `ui-card--${variant}`, className);
  if (as === "article") return <article className={classes} {...props} />;
  if (as === "div") return <div className={classes} {...props} />;
  return <section className={classes} {...props} />;
}

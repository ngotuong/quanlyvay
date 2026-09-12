import type { HTMLAttributes } from "react";
import { cx } from "./utils";

export function Tabs({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <nav className={cx("ui-tabs", className)} {...props} />;
}

export function TabList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ui-tab-list", className)} {...props} />;
}

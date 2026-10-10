import type { ReactNode } from "react";

export function Skeleton({ className = "", children }: { className?: string; children?: ReactNode }) {
  return <div className={`skeleton ${className}`} aria-hidden="true">{children}</div>;
}

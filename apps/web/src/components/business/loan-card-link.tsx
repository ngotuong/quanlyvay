"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

export function LoanCardLink({ children, direction, href }: { children: ReactNode; direction: string; href: string }) {
  const [pending, setPending] = useState(false);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
  }, []);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    pendingTimer.current = setTimeout(() => setPending(true), 300);
  }

  return <>
    <Link className="loan-card" data-direction={direction} href={href} onClick={handleClick}>{children}</Link>
    {pending ? <div className="content-loading loan-navigation-loading" aria-live="polite" aria-busy="true" role="status">
      <span className="loan-navigation-spinner" aria-hidden="true" />
      <span>Đang mở khoản vay…</span>
    </div> : null}
  </>;
}

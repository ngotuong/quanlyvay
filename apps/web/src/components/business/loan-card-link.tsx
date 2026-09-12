"use client";

import Link from "next/link";
import { Banknote } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";

export function LoanCardLink({ children, direction, href, quickActionHref }: { children: ReactNode; direction: string; href: string; quickActionHref?: string }) {
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
    <div className="loan-card-shell">
      <Link className="loan-card ui-card ui-card--interactive" data-direction={direction} href={href} onClick={handleClick}>{children}</Link>
      {quickActionHref ? <Link className="loan-card-quick-action" href={quickActionHref} aria-label="Ghi giao dịch cho khoản vay"><Banknote size={16} aria-hidden="true" />Ghi giao dịch</Link> : null}
    </div>
    {pending ? <div className="content-loading loan-navigation-loading" aria-live="polite" aria-busy="true" role="status">
      <span className="loan-navigation-spinner" aria-hidden="true" />
      <span>Đang mở khoản vay…</span>
    </div> : null}
  </>;
}

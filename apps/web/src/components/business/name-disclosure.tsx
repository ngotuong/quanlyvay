"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { usePrivacy } from "@/components/app/privacy-provider";
import { Button } from "@/components/ui/button";

// The full identity stays in its original heading/link. The sibling control never navigates.
export function NameDisclosure({ children, as = "div", className = "" }: { children: ReactNode; as?: "div" | "span"; className?: string }) {
  const scope = useRef<HTMLElement | null>(null);
  const id = useId();
  const { isPrivacyMode } = usePrivacy();
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  useEffect(() => {
    const target = scope.current?.querySelector<HTMLElement>("[data-disclosure-name]");
    if (!target) return;
    target.id = id;
    let active = true;
    const measure = () => {
      if (!active) return;
      const lineHeight = parseFloat(getComputedStyle(target).lineHeight);
      const range = document.createRange();
      range.selectNodeContents(target);
      const bounds = range.getBoundingClientRect();
      setTruncated(!isPrivacyMode && (target.scrollHeight > lineHeight * 2 + 1 || bounds.height > lineHeight * 2 + 1));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(target);
    void document.fonts.ready.then(measure);
    measure();
    return () => { active = false; observer.disconnect(); };
  }, [children, id, isPrivacyMode]);
  const Tag = as;
  return <Tag ref={(node) => { scope.current = node; }} className={`name-disclosure ${className}`} data-expanded={!isPrivacyMode && expanded}>
    {children}
    {truncated && !isPrivacyMode ? <Button variant="ghost" className="name-disclosure-toggle" aria-controls={id} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? "Thu gọn tên" : "Xem đầy đủ"}</Button> : null}
  </Tag>;
}

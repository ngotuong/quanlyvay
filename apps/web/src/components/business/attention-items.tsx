"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui";

// The server supplies the complete authoritative task set; expanding only changes visibility.
export function AttentionItems({ items, heading, emptyState }: { items: ReactNode[]; heading: ReactNode; emptyState?: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const expansionOrigin = useRef<{ left: number; top: number } | null>(null);
  const id = useId();
  return <div className="attention-groups">
    <div className="dashboard-section-heading attention-heading">
    {heading}
    {items.length > 5 ? <Button variant="ghost" className="attention-toggle" aria-label={expanded ? "Thu gọn về 5 việc" : `Xem toàn bộ ${items.length} việc cần xử lý`} aria-expanded={expanded} aria-controls={id} onFocus={(event) => {
      // Native focus scrolling does not account for the fixed mobile navigation.
      // Reveal the toggle before expansion so keyboard and pointer retain its position.
      const nav = document.querySelector(".mobile-nav-wrap")?.getBoundingClientRect();
      const visibleBottom = nav && nav.height > 0 ? nav.top : window.innerHeight;
      if (event.currentTarget.getBoundingClientRect().bottom > visibleBottom) {
        event.currentTarget.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }} onClick={() => {
      const current = { left: window.scrollX, top: window.scrollY };
      const restore = expanded && expansionOrigin.current ? expansionOrigin.current : current;
      if (!expanded) expansionOrigin.current = current;
      flushSync(() => setExpanded(value => !value));
      window.scrollTo({ ...restore, behavior: "instant" });
      if (expanded) expansionOrigin.current = null;
    }}>
      {expanded ? "Thu gọn" : "Xem tất cả"}
    </Button> : null}
    </div>
    <div className="due-list schedule-list" id={id}>{items.length ? expanded ? items : items.slice(0, 5) : emptyState}</div>
  </div>;
}

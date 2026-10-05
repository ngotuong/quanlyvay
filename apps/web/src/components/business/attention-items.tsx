"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui";

// The server supplies the complete authoritative task set; expanding only changes visibility.
export function AttentionItems({ items, heading, emptyState }: { items: ReactNode[]; heading: ReactNode; emptyState?: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
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
    }} onClick={() => setExpanded(value => !value)}>
      {expanded ? "Thu gọn" : "Xem tất cả"}
    </Button> : null}
    </div>
    <div className="due-list schedule-list" id={id}>{items.length ? expanded ? items : items.slice(0, 5) : emptyState}</div>
  </div>;
}

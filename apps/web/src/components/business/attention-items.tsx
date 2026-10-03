"use client";

import { useId, useState, type ReactNode } from "react";
import { Button } from "@/components/ui";

// The server supplies the complete authoritative task set; expanding only changes visibility.
export function AttentionItems({ items }: { items: ReactNode[] }) {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  return <div className="attention-groups">
    {items.length > 5 ? <Button variant="secondary" className="attention-toggle" aria-expanded={expanded} aria-controls={id} onFocus={(event) => {
      // Native focus scrolling does not account for the fixed mobile navigation.
      // Reveal the toggle before expansion so keyboard and pointer retain its position.
      const nav = document.querySelector(".mobile-nav-wrap")?.getBoundingClientRect();
      const visibleBottom = nav && nav.height > 0 ? nav.top : window.innerHeight;
      if (event.currentTarget.getBoundingClientRect().bottom > visibleBottom) {
        event.currentTarget.scrollIntoView({ block: "center", behavior: "instant" });
      }
    }} onClick={() => setExpanded(value => !value)}>
      {expanded ? "Thu gọn về 5 việc" : `Xem toàn bộ ${items.length} việc cần xử lý`}
    </Button> : null}
    <div className="due-list schedule-list" id={id}>{expanded ? items : items.slice(0, 5)}</div>
  </div>;
}

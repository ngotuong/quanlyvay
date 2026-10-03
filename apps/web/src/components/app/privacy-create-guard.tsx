"use client";

import { useId, useState, type RefObject } from "react";
import { Eye, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { usePrivacy } from "./privacy-provider";

/** Explain privacy before entering a modal whose surrounding controls become inert. */
export function PrivacyCreateGuard({ triggerRef, className, label, onOpen }: {
  triggerRef: RefObject<HTMLButtonElement | null>;
  className: string;
  label: string;
  onOpen: () => void;
}) {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();
  const [explain, setExplain] = useState(false);
  const noticeId = useId();
  const showNotice = explain && isPrivacyMode;

  return <div className="privacy-create-guard">
    <Button ref={triggerRef} className={className} aria-describedby={showNotice ? noticeId : undefined} onClick={() => {
      if (isPrivacyMode) setExplain(true);
      else { setExplain(false); onOpen(); }
    }}><Plus size={18} aria-hidden="true" />{label}</Button>
    {showNotice ? <div className="privacy-create-notice">
      <p id={noticeId} role="status">Chế độ riêng tư đang bật. Cần hiển thị dữ liệu để {label.toLocaleLowerCase("vi-VN")}.</p>
      <Button variant="secondary" onClick={() => {
        togglePrivacyMode();
        setExplain(false);
        onOpen();
      }}><Eye size={18} aria-hidden="true" />Hiển thị số tiền để tiếp tục</Button>
    </div> : null}
  </div>;
}

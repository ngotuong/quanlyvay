"use client";

import React, { createContext, useContext, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { VndText } from "@/components/ui/vnd-text";

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivacyMode: false,
  togglePrivacyMode: () => {},
});

export function PrivacyProvider({ children, initialPrivacy = false }: { children: React.ReactNode; initialPrivacy?: boolean }) {
  const [isPrivacyMode, setIsPrivacyMode] = useState(initialPrivacy);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      document.cookie = `qlv_privacy_mode=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      return next;
    });
  };

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
}

export function PrivacyRegion({ children }: { children: React.ReactNode }) {
  const { isPrivacyMode } = usePrivacy();
  return isPrivacyMode ? <span className="privacy-placeholder">Nội dung đang ẩn</span> : children;
}

export function PrivacyForm({ children }: { children: React.ReactNode }) {
  const { isPrivacyMode } = usePrivacy();
  return isPrivacyMode ? <p className="viewer-notice">Hãy bấm “Hiển thị số tiền” để xem và ghi nghiệp vụ.</p> : children;
}

export function PrivacyToggle({ className = "" }: { className?: string }) {
  const { isPrivacyMode, togglePrivacyMode } = usePrivacy();

  return (
    <button
      type="button"
      className={`icon-button privacy-toggle-btn ${className}`}
      onClick={togglePrivacyMode}
      aria-label={isPrivacyMode ? "Hiển thị số tiền" : "Ẩn số tiền (Chế độ riêng tư)"}
      title={isPrivacyMode ? "Hiển thị số tiền" : "Ẩn số tiền (Chế độ riêng tư)"}
    >
      {isPrivacyMode ? <EyeOff size={19} className="text-amber-500" /> : <Eye size={19} />}
    </button>
  );
}

export function PrivacyAmount({
  value,
  fallback = "**** ₫",
  className = "",
}: {
  value: React.ReactNode;
  fallback?: string;
  className?: string;
}) {
  const { isPrivacyMode } = usePrivacy();

  if (isPrivacyMode) {
    return (
      <span className={`privacy-amount-masked font-mono font-semibold tracking-widest text-slate-400 ${className}`} title="Chế độ riêng tư đang bật">
        {fallback}
      </span>
    );
  }

  return <span className={`privacy-amount ${className}`}>{typeof value === "string" && value.endsWith("₫") ? <VndText formatted={value} /> : value}</span>;
}

export function PrivacyAccessibleValue({
  children,
  label,
  privateLabel,
  title = label,
  privateTitle = privateLabel,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  label: string;
  privateLabel: string;
  title?: string;
  privateTitle?: string;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLSpanElement>, "children" | "aria-label" | "title">) {
  const { isPrivacyMode } = usePrivacy();

  return (
    <span
      {...props}
      className={className}
      aria-label={isPrivacyMode ? privateLabel : label}
      title={isPrivacyMode ? privateTitle : title}
    >
      {children}
    </span>
  );
}

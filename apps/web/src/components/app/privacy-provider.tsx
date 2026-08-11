"use client";

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PrivacyContextType {
  isPrivacyMode: boolean;
  togglePrivacyMode: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
  isPrivacyMode: false,
  togglePrivacyMode: () => {},
});

const emptySubscribe = () => () => {};

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
  const isServer = useSyncExternalStore(
    emptySubscribe,
    () => false,
    () => true,
  );

  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("qlv_privacy_mode") === "true";
  });

  useEffect(() => {
    if (isPrivacyMode) {
      document.documentElement.setAttribute("data-privacy-mode", "true");
    } else {
      document.documentElement.setAttribute("data-privacy-mode", "false");
    }
  }, [isPrivacyMode]);

  const togglePrivacyMode = () => {
    setIsPrivacyMode((prev) => {
      const next = !prev;
      localStorage.setItem("qlv_privacy_mode", next ? "true" : "false");
      return next;
    });
  };

  return (
    <PrivacyContext.Provider value={{ isPrivacyMode: isServer ? false : isPrivacyMode, togglePrivacyMode }}>
      {children}
    </PrivacyContext.Provider>
  );
}

export function usePrivacy() {
  return useContext(PrivacyContext);
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

  return <span className={`privacy-amount ${className}`}>{value}</span>;
}

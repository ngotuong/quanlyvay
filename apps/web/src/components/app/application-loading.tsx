"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useRef, useState } from "react";

const applicationReadyEvent = "app:application-ready";
const minimumVisibleMs = 550;
const exitDurationMs = 160;
const slowLoadingMs = 15_000;
const warmResumeThresholdMs = 1_000;

type LoadingPhase = "visible" | "exiting" | "hidden";
type LoadingVariant = "initial" | "resume";

export function ApplicationReadySignal() {
  useEffect(() => {
    document.documentElement.dataset.applicationReady = "true";
    window.dispatchEvent(new Event(applicationReadyEvent));
    return () => {
      delete document.documentElement.dataset.applicationReady;
    };
  }, []);
  return null;
}

export function ApplicationBootLoading() {
  const [phase, setPhase] = useState<LoadingPhase>("visible");
  const [variant, setVariant] = useState<LoadingVariant>("initial");
  const [cycle, setCycle] = useState(0);
  const [slow, setSlow] = useState(false);
  const startedAt = useRef(0);
  const hiddenAt = useRef(0);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);

  const begin = useCallback((nextVariant: LoadingVariant) => {
    clearTimers();
    startedAt.current = performance.now();
    setSlow(false);
    setVariant(nextVariant);
    setPhase("visible");
    setCycle((value) => value + 1);
  }, [clearTimers]);

  useEffect(() => {
    startedAt.current = performance.now();
  }, []);

  useEffect(() => {
    if (phase === "hidden") delete document.documentElement.dataset.applicationLoading;
    else document.documentElement.dataset.applicationLoading = "true";
  }, [phase]);

  useEffect(() => {
    let frame = 0;
    let readySince = 0;
    let exiting = false;

    // Auth hydration alone does not mean the streamed page is painted. Next can
    // keep previous/future segments in hidden containers, so inspect visibility,
    // not just the presence/absence of a skeleton anywhere in the document.
    const isVisible = (element: Element) => element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const contentReady = () => {
      if (document.documentElement.dataset.applicationReady !== "true") return false;
      const main = Array.from(document.querySelectorAll<HTMLElement>("#main-content")).find(isVisible);
      if (!main || !main.innerText.trim() || main.getBoundingClientRect().height === 0) return false;
      return !Array.from(main.querySelectorAll(".content-loading")).some(isVisible);
    };
    const check = (now: number) => {
      if (!contentReady()) {
        readySince = 0;
        if (exiting) { exiting = false; setPhase("visible"); }
      } else {
        if (!readySince) readySince = now;
        // Recheck throughout the minimum display period AND the exit animation;
        // never let a previously scheduled timer uncover a newly pending page.
        if (now - startedAt.current >= minimumVisibleMs && now - readySince >= 100) {
          if (!exiting) { exiting = true; setPhase("exiting"); readySince = now; }
          else if (now - readySince >= exitDurationMs) { setPhase("hidden"); return; }
        }
      }
      frame = window.requestAnimationFrame(check);
    };
    frame = window.requestAnimationFrame(check);
    // A slow request must not turn an empty Suspense fallback into a blank screen.
    // Keep feedback and offer explicit recovery instead of hiding at a deadline.
    timers.current.push(window.setTimeout(() => setSlow(true), slowLoadingMs));
    return () => {
      window.cancelAnimationFrame(frame);
      clearTimers();
    };
  }, [clearTimers, cycle]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt.current = performance.now();
        return;
      }
      if (hiddenAt.current && performance.now() - hiddenAt.current >= warmResumeThresholdMs) begin("resume");
      hiddenAt.current = 0;
    };
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) begin("resume");
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [begin]);

  if (phase === "hidden") return null;
  return (
    <div
      className="initial-app-loading initial-loading-visual application-boot-loading"
      data-loading-phase={phase}
      data-loading-variant={variant}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-hidden={phase === "exiting" ? "true" : undefined}
    >
      <Image className="initial-app-loading-logo" src="/icons/brand-symbol-192.png" width={64} height={64} alt="" priority unoptimized />
      <h1>Quản Lý Vay</h1>
      <strong>{slow ? "Nội dung đang tải lâu hơn dự kiến…" : variant === "resume" ? "Đang khôi phục phiên làm việc…" : "Đang mở không gian tài chính…"}</strong>
      <div className="initial-app-loading-track" aria-hidden="true"><span /></div>
      {slow ? <Button variant="secondary" onClick={() => window.location.reload()}>Tải lại trang</Button> : null}
      <span>{variant === "resume" ? "Đang chuẩn bị lại nội dung an toàn." : "Đang kiểm tra phiên đăng nhập và chuẩn bị dữ liệu an toàn."}</span>
    </div>
  );
}

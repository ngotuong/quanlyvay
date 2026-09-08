"use client";
import { useMemo, useRef, useState } from "react";
import type { BusinessActionState } from "@/lib/business/action-state";
import { captureRender, recoverUncommittedRender } from "@/lib/business/render-recovery.mjs";

export function useBusinessAction(action: (state: BusinessActionState, data: FormData) => Promise<BusinessActionState>, initial: BusinessActionState) {
  const [state, setState] = useState(initial);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const formState = useMemo(() => ({ ...state, pending }), [state, pending]);
  async function dispatch(data: FormData) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    const before = captureRender(document, window.location);
      try {
        const result = await action(state, data);
        setState(result);
        if (result.ok) recoverUncommittedRender(before, { document, location: window.location });
      }
      catch (error) {
        // Next redirects are control flow, not failed business operations.
        if (typeof error === "object" && error && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
        setState({ ok: false, message: "Chưa thể xác nhận thao tác. Kiểm tra kết nối rồi thử lại; giữ nguyên dữ liệu và mã giao dịch để tránh ghi trùng." });
      } finally { busy.current = false; setPending(false); }
  }
  // Actions revalidate affected routes and return their updated RSC tree. Starting a
  // second refresh here can supersede that tree before the mutation render commits.
  return [formState, dispatch, pending] as const;
}

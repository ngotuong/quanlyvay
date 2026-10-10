"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { BottomSheet, Button } from "@/components/ui";
import { VndText } from "@/components/ui/vnd-text";
import { formatDate, formatVnd, todayInVietnam } from "@/lib/business/format";
import type { PaymentContext } from "@/lib/business/payment-context";
import { LoanPaymentForm } from "./loan-payment-form";

type Props = {
  loanId: string;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
  onClose: (message?: string) => void;
  onUnmount: () => void;
};
type ReadResult = { key: string; context: PaymentContext | null; error: string };

export default function DashboardPaymentDrawer({ loanId, onDirtyChange, onPendingChange, onClose, onUnmount }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef(onUnmount);
  useLayoutEffect(() => { returnFocus.current = onUnmount; }, [onUnmount]);
  const [date, setDate] = useState(todayInVietnam);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<ReadResult | null>(null);
  const [seed, setSeed] = useState<PaymentContext | null>(null);
  const [pending, setPending] = useState(false);
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const requestKey = `${loanId}:${date}:${retry}`;
  const fresh = result?.key === requestKey ? result : null;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date);

  useLayoutEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); returnFocus.current(); };
  }, []);
  useEffect(() => {
    if (!validDate) return;
    const controller = new AbortController();
    let alive = true;
    let timedOut = false;
    const deadline = setTimeout(() => { timedOut = true; controller.abort(); }, 12_000);
    async function read() {
      try {
        const response = await fetch(`/api/loans/${loanId}/payment-context?date=${encodeURIComponent(date)}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json() as { error?: string; context?: PaymentContext | null };
        if (!alive) return;
        if (!response.ok || !payload.context || payload.context.loanId !== loanId || payload.context.asOfDate !== date) {
          setResult({ key: requestKey, context: null, error: payload.error || "Chưa thể tải khoản vay. Hãy thử lại." });
          return;
        }
        setResult({ key: requestKey, context: payload.context, error: "" });
        setSeed(current => current ?? payload.context!);
      } catch {
        if (alive) setResult({ key: requestKey, context: null, error: timedOut ? "Tải số dư quá lâu. Giữ nguyên dữ liệu và thử lại." : "Chưa thể tải số dư. Kiểm tra kết nối rồi thử lại." });
      } finally { clearTimeout(deadline); }
    }
    void read();
    return () => { alive = false; clearTimeout(deadline); controller.abort(); };
  }, [loanId, date, retry, requestKey, validDate]);

  const context = fresh?.context;
  const ready = Boolean(context && context.status !== "SETTLED");
  const feedback = !validDate ? "Chọn ngày thanh toán để xem số dư." : fresh?.error || (context?.status === "SETTLED" ? "Khoản vay đã tất toán. Hãy mở chi tiết để xem lịch sử." : !fresh ? "Đang tải số dư…" : "");
  const balance = <div className="dashboard-payment-context">
    {seed ? <><p className="payment-direction">{seed.direction === "LENDING" ? "Cho vay · Thu tiền" : "Đi vay · Trả tiền"}</p><strong className="payment-loan-name">{seed.name}</strong><span>{seed.counterpartyName}</span></> : null}
    {context ? <><dl><div><dt>Dư gốc</dt><dd><VndText formatted={formatVnd(context.principalOutstandingVnd)} /></dd></div><div><dt>Lãi còn lại</dt><dd><VndText formatted={formatVnd(context.interestBalanceVnd)} /></dd></div></dl><p className="field-hint">Số dư đến {formatDate(context.asOfDate)}. Có thể ghi một phần hoặc nhập số tiền thực thu/trả.</p></> : null}
    {feedback ? <p role="status" className={fresh?.error ? "field-error" : "field-hint"}>{feedback}</p> : null}
    {fresh?.error ? <Button type="button" variant="secondary" onClick={() => setRetry(value => value + 1)} disabled={pending}>Thử lại</Button> : null}
  </div>;
  return <BottomSheet className="dashboard-payment-drawer" ref={dialog} title="Ghi giao dịch" eyebrow="Công việc đến hạn" closeDisabled={pending} onRequestClose={() => onClose()}>
    {seed ? <LoanPaymentForm loanId={loanId} idempotencyKey={idempotencyKey} registerNavigationDraft={false}
      context={balance} initialPayment={{ type: "INTEREST_PAYMENT", amountVnd: BigInt(seed.interestBalanceVnd) > BigInt(0) ? seed.interestBalanceVnd : "" }}
      principalOutstandingVnd={context?.principalOutstandingVnd ?? "0"} suggestedInterestVnd={ready ? context?.interestBalanceVnd : undefined}
      canSubmit={ready} onDateChange={setDate} onDirtyChange={onDirtyChange}
      onPendingChange={value => { setPending(value); onPendingChange(value); }} onSuccess={onClose} onCancel={() => onClose()} />
      : <div className="dashboard-payment-loading">{balance}<Button type="button" variant="secondary" onClick={() => onClose()}>Hủy</Button></div>}
  </BottomSheet>;
}

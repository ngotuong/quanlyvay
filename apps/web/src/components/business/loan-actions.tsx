"use client";
import { useBusinessAction } from "./use-business-action";

import { useEffect, useRef, useState, type RefObject } from "react";
import { CircleCheckBig, Plus, RefreshCw } from "lucide-react";
import {
  recordExpenseAction,
  recordLifecycleAction,
} from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { todayInVietnam } from "@/lib/business/format";
import type { LoanStatus } from "@/lib/business/types";
import { BusinessForm, ActionMessage, FieldError, FormSubmit } from "./form-parts";
import { LoanPaymentForm } from "./loan-payment-form";
import { SettlementForm } from "./settlement-form";
import { PrincipalRestructureForm } from "./principal-restructure-form";
import { BottomSheet, Button, DateInput, VndInput, notifyToast } from "@/components/ui";

type Keys = { payment: string; expense: string; lifecycle: string; settlement: string; restructure: string };
type DialogActivity = { dirty: boolean; pending: boolean };
const idleDialog: DialogActivity = { dirty: false, pending: false };

export function LoanActions({ loanId, status, interestCycleDays, keys, context, mode = "all", autoOpen = false, initialPayment, principalOutstandingVnd }: { loanId: string; status: LoanStatus; interestCycleDays: 15 | 30; keys: Keys; context?: { name: string; outstandingVnd: string; interestBalanceVnd: string }; mode?: "all" | "payment" | "management"; autoOpen?: boolean; initialPayment?: { type: "INTEREST_PAYMENT" | "PRINCIPAL_PAYMENT"; amountVnd: string }; principalOutstandingVnd?: string }) {
  const [expenseState, expenseAction] = useBusinessAction(recordExpenseAction, initialBusinessActionState);
  const [lifecycleState, lifecycleAction] = useBusinessAction(recordLifecycleAction, initialBusinessActionState);
  const [eventType, setEventType] = useState<"RATE_CHANGE" | "BAD_DEBT_START" | "INTEREST_RESUME">(status === "BAD_DEBT" ? "INTEREST_RESUME" : "RATE_CHANGE");
  const paymentDialog = useRef<HTMLDialogElement>(null);
  const settlementDialog = useRef<HTMLDialogElement>(null);
  const restructureDialog = useRef<HTMLDialogElement>(null);
  const paymentTrigger = useRef<HTMLButtonElement>(null);
  const settlementTrigger = useRef<HTMLButtonElement>(null);
  const restructureTrigger = useRef<HTMLButtonElement>(null);
  const [paymentActivity, setPaymentActivity] = useState(idleDialog);
  const [settlementActivity, setSettlementActivity] = useState(idleDialog);
  const [restructureActivity, setRestructureActivity] = useState(idleDialog);
  const [paymentSession, setPaymentSession] = useState(0);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [restructureOpen, setRestructureOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoOpened = useRef(false);
  const today = todayInVietnam();
  const isSettled = status === "SETTLED";
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function updateActivity(setter: typeof setPaymentActivity, field: keyof DialogActivity, value: boolean) {
    setter(current => current[field] === value ? current : { ...current, [field]: value });
  }

  function requestDialogClose({ activity, dialog, focus, reset, force = false, focusMain = false, message }: {
    activity: DialogActivity;
    dialog: RefObject<HTMLDialogElement | null>;
    focus: RefObject<HTMLButtonElement | null>;
    reset: () => void;
    force?: boolean;
    focusMain?: boolean;
    message?: string;
  }) {
    const element = dialog.current;
    if (!element?.open || element.classList.contains("is-closing")) return;
    if (!force && activity.pending) return;
    if (!force && activity.dirty && !window.confirm("Đóng và bỏ các thay đổi chưa lưu?")) return;
    element.classList.add("is-closing");
    closeTimer.current = setTimeout(() => {
      if (element.open) element.close();
      element.classList.remove("is-closing");
      reset();
      const target = focusMain ? document.querySelector<HTMLElement>("#main-content") : focus.current;
      target?.focus({ preventScroll: true });
      if (message) notifyToast(message, "success");
      closeTimer.current = null;
    }, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
  }

  function openPaymentDialog() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const dialog = paymentDialog.current;
    if (!dialog) return;
    dialog.classList.remove("is-closing");
    if (!dialog.open) dialog.showModal();
  }

  function resetPayment() { setPaymentActivity(idleDialog); setPaymentSession(value => value + 1); }
  function closePaymentDialog(message?: string) { requestDialogClose({ activity: paymentActivity, dialog: paymentDialog, focus: paymentTrigger, reset: resetPayment, force: Boolean(message), message }); }

  function openSettlementDialog() {
    const dialog = settlementDialog.current;
    if (dialog && !dialog.open) { setSettlementOpen(true); dialog.showModal(); }
  }

  function resetSettlement() { setSettlementActivity(idleDialog); setSettlementOpen(false); }
  function closeSettlementDialog(message?: string) { requestDialogClose({ activity: settlementActivity, dialog: settlementDialog, focus: settlementTrigger, reset: resetSettlement, force: Boolean(message), focusMain: Boolean(message), message }); }

  function openRestructureDialog() {
    const dialog = restructureDialog.current;
    if (dialog && !dialog.open) { setRestructureOpen(true); dialog.showModal(); }
  }

  function resetRestructure() { setRestructureActivity(idleDialog); setRestructureOpen(false); }
  function closeRestructureDialog(message?: string) { requestDialogClose({ activity: restructureActivity, dialog: restructureDialog, focus: restructureTrigger, reset: resetRestructure, force: Boolean(message), message }); }

  useEffect(() => {
    if (!autoOpen || autoOpened.current || isSettled) return;
    autoOpened.current = true;
    openPaymentDialog();
  }, [autoOpen, isSettled]);

  if (isSettled) return mode === "payment" || mode === "all" ? <div className="settled-notice">Khoản vay đã tất toán. Chỉ còn xem lịch sử và hoàn tác nghiệp vụ hợp lệ.</div> : null;

  return (
    <section className="action-drawer-grid" id={mode === "payment" ? "transaction-actions" : undefined} aria-label="Ghi nhận nghiệp vụ">
      {mode !== "management" ? <div className="transaction-action">
        <div className="loan-primary-actions">
          <Button ref={paymentTrigger} className="primary-button transaction-trigger" type="button" onClick={openPaymentDialog}><Plus size={18} />Giao dịch</Button>
          <Button ref={settlementTrigger} variant="danger" className="danger-button settlement-trigger" type="button" onClick={openSettlementDialog}><CircleCheckBig size={18} />Tất toán</Button>
          <Button ref={restructureTrigger} variant="secondary" className="secondary-button restructure-trigger" type="button" onClick={openRestructureDialog}><RefreshCw size={18} />Giảm gốc</Button>
        </div>
        <p>Ghi khoản thu/trả hằng ngày, giảm gốc để bắt đầu kỳ lãi mới hoặc tất toán toàn bộ.</p>
        <BottomSheet eyebrow="Nghiệp vụ khoản vay" title="Ghi giao dịch" titleId="transaction-dialog-title" ref={paymentDialog} closeDisabled={paymentActivity.pending} onRequestClose={() => closePaymentDialog()}>
          <LoanPaymentForm key={paymentSession} loanId={loanId} idempotencyKey={keys.payment}
            initialPayment={paymentSession === 0 ? initialPayment : initialPayment ? { type: initialPayment.type, amountVnd: "" } : undefined}
            principalOutstandingVnd={principalOutstandingVnd}
            context={context ? <p className="transaction-context"><strong>{context.name}</strong><span>Dư gốc {context.outstandingVnd} · Lãi còn lại {context.interestBalanceVnd}</span></p> : null}
            onDirtyChange={dirty => updateActivity(setPaymentActivity, "dirty", dirty)}
            onPendingChange={pending => updateActivity(setPaymentActivity, "pending", pending)}
            onSuccess={closePaymentDialog} onCancel={() => closePaymentDialog()} />
        </BottomSheet>
        <BottomSheet eyebrow="Tái cơ cấu dư gốc" title="Giảm gốc và mở kỳ mới" titleId="restructure-dialog-title" ref={restructureDialog} closeDisabled={restructureActivity.pending} onRequestClose={() => closeRestructureDialog()}>
          <div className="settlement-dialog-copy"><strong>Không tạo khoản vay giả hoặc dòng tiền giải ngân mới</strong><span>Ngày hiệu lực bắt đầu kỳ mới; lãi của dư gốc cũ được chốt tự động đến hết ngày liền trước.</span></div>
          <div className="dialog-form">{restructureOpen ? <PrincipalRestructureForm loanId={loanId} idempotencyKey={keys.restructure}
            onDirtyChange={dirty => updateActivity(setRestructureActivity, "dirty", dirty)}
            onPendingChange={pending => updateActivity(setRestructureActivity, "pending", pending)}
            onSuccess={closeRestructureDialog} /> : null}</div>
        </BottomSheet>
        <BottomSheet eyebrow="Thao tác quan trọng" title="Tất toán khoản vay" titleId="settlement-dialog-title" ref={settlementDialog} closeDisabled={settlementActivity.pending} onRequestClose={() => closeSettlementDialog()}>
          <div className="settlement-dialog-copy"><strong>Kiểm tra số tiền trước khi xác nhận</strong><span>Hệ thống sẽ ghi toàn bộ gốc và lãi còn lại tại ngày bạn chọn.</span></div>
          <div className="dialog-form">{settlementOpen ? <SettlementForm loanId={loanId} idempotencyKey={keys.settlement}
            onDirtyChange={dirty => updateActivity(setSettlementActivity, "dirty", dirty)}
            onPendingChange={pending => updateActivity(setSettlementActivity, "pending", pending)}
            onSuccess={closeSettlementDialog} /> : null}</div>
        </BottomSheet>
      </div> : null}

      {mode === "management" ? <div className="management-group-heading"><p className="eyebrow">Trong quá trình vay</p><h2>Điều chỉnh nghiệp vụ</h2><span>Các thay đổi dưới đây ảnh hưởng chi phí, lãi suất hoặc trạng thái tính lãi.</span></div> : null}

      {mode !== "payment" ? <details className="action-drawer">
        <summary><span>Chi phí liên quan khoản vay<small>Ghi khoản chi phát sinh riêng cho khoản vay này.</small></span></summary>
        <BusinessForm state={expenseState} action={expenseAction} className="compact-form">
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.expense} />
          <div className="field-group"><label htmlFor="expenseDate">Ngày chi</label><DateInput id="expenseDate" name="transactionDate" defaultValue={today} required /><FieldError state={expenseState} name="transactionDate" /></div>
          <div className="field-group"><label htmlFor="expenseAmount">Số tiền (VND)</label><VndInput id="expenseAmount" name="amountVnd" required /><FieldError state={expenseState} name="amountVnd" /></div>
          <div className="field-group"><label htmlFor="expenseCategory">Nhóm chi phí</label><input id="expenseCategory" name="category" required placeholder="Ví dụ: Đi lại" /><FieldError state={expenseState} name="category" /></div>
          <div className="field-group"><label htmlFor="expenseNote">Ghi chú</label><input id="expenseNote" name="note" maxLength={500} /><FieldError state={expenseState} name="note" /></div>
          <ActionMessage state={expenseState} /><FormSubmit>Ghi chi phí</FormSubmit>
        </BusinessForm>
      </details> : null}

      {mode !== "payment" ? <details className="action-drawer">
        <summary><span>{status === "BAD_DEBT" ? "Bật lại tính lãi" : "Lãi suất và trạng thái nợ xấu"}<small>{status === "BAD_DEBT" ? "Tiếp tục phát sinh lãi từ ngày hiệu lực." : "Đổi lãi suất hoặc ngừng tính lãi khi chuyển nợ xấu."}</small></span></summary>
        <BusinessForm state={lifecycleState} action={lifecycleAction} className="compact-form">
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.lifecycle} />
          <div className="field-group"><label htmlFor="eventType">Thao tác</label><select id="eventType" name="eventType" value={eventType} onChange={(event) => setEventType(event.target.value as typeof eventType)}>{status !== "BAD_DEBT" ? <><option value="RATE_CHANGE">Đổi lãi suất</option><option value="BAD_DEBT_START">Chuyển nợ xấu, ngừng lãi</option></> : <option value="INTEREST_RESUME">Bật lại tính lãi</option>}</select><FieldError state={lifecycleState} name="eventType" /></div>
          <div className="field-group"><label htmlFor="effectiveDate">{eventType === "BAD_DEBT_START" ? "Ngày cuối cùng còn tính lãi" : "Ngày hiệu lực"}</label><DateInput id="effectiveDate" name="effectiveDate" defaultValue={today} required aria-describedby="effective-date-hint" /><FieldError state={lifecycleState} name="effectiveDate" /><p className="field-hint" id="effective-date-hint">{eventType === "BAD_DEBT_START" ? "Ngày này vẫn được tính lãi; hệ thống ngừng phát sinh lãi từ ngày kế tiếp. Nếu kỳ cuối chưa đóng nhưng vẫn phải thu đủ, hãy chọn ngày kết thúc kỳ đó." : eventType === "INTEREST_RESUME" ? "Hệ thống bắt đầu tính lãi trở lại từ đầu ngày này." : "Lãi suất mới áp dụng từ đầu ngày này. Muốn giữ nguyên kỳ đã đóng, hãy chọn ngày đầu kỳ kế tiếp."}</p></div>
          <div className="field-group"><label htmlFor="newRate">Lãi suất mới (%/{interestCycleDays} ngày)</label><input id="newRate" name="periodRatePercent" inputMode="decimal" placeholder="Để trống khi chuyển nợ xấu" aria-describedby="new-rate-hint" /><p className="field-hint" id="new-rate-hint">Nhập phần trăm của cả kỳ {interestCycleDays} ngày.</p><FieldError state={lifecycleState} name="periodRatePercent" /></div>
          <div className="field-group"><label htmlFor="eventNote">Ghi chú</label><input id="eventNote" name="note" maxLength={500} /><FieldError state={lifecycleState} name="note" /></div>
          <ActionMessage state={lifecycleState} /><FormSubmit>Cập nhật</FormSubmit>
        </BusinessForm>
      </details> : null}

    </section>
  );
}

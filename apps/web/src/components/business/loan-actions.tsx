"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  recordExpenseAction,
  recordLifecycleAction,
  recordPaymentAction,
  settleLoanAction,
} from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { todayInVietnam } from "@/lib/business/format";
import type { LoanStatus } from "@/lib/business/types";
import { ActionMessage, FieldError, FormSubmit } from "./form-parts";
import { VndInput } from "./vnd-input";

type Keys = { payment: string; expense: string; lifecycle: string; settlement: string };

export function LoanActions({ loanId, status, interestCycleDays, keys, context, mode = "all" }: { loanId: string; status: LoanStatus; interestCycleDays: 15 | 30; keys: Keys; context?: { name: string; outstandingVnd: string; interestBalanceVnd: string }; mode?: "all" | "payment" | "management" }) {
  const [paymentState, paymentAction] = useActionState(recordPaymentAction, initialBusinessActionState);
  const [expenseState, expenseAction] = useActionState(recordExpenseAction, initialBusinessActionState);
  const [lifecycleState, lifecycleAction] = useActionState(recordLifecycleAction, initialBusinessActionState);
  const [settlementState, settlementAction] = useActionState(settleLoanAction, initialBusinessActionState);
  const [eventType, setEventType] = useState<"RATE_CHANGE" | "BAD_DEBT_START" | "INTEREST_RESUME">(status === "BAD_DEBT" ? "INTEREST_RESUME" : "RATE_CHANGE");
  const paymentDialog = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const today = todayInVietnam();
  const isSettled = status === "SETTLED";

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  function openPaymentDialog() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    const dialog = paymentDialog.current;
    if (!dialog) return;
    dialog.classList.remove("is-closing");
    if (!dialog.open) dialog.showModal();
  }

  function closePaymentDialog() {
    const dialog = paymentDialog.current;
    if (!dialog?.open || dialog.classList.contains("is-closing")) return;
    dialog.classList.add("is-closing");
    closeTimer.current = setTimeout(() => {
      dialog.close();
      dialog.classList.remove("is-closing");
      closeTimer.current = null;
    }, 180);
  }

  if (isSettled) return mode === "payment" || mode === "all" ? <div className="settled-notice">Khoản vay đã tất toán. Chỉ còn xem lịch sử và hoàn tác nghiệp vụ hợp lệ.</div> : null;

  return (
    <section className="action-drawer-grid" aria-label="Ghi nhận nghiệp vụ">
      {mode !== "management" ? <div className="transaction-action">
        <button className="primary-button transaction-trigger" type="button" onClick={openPaymentDialog}><Plus size={18} />Ghi giao dịch</button>
        <p>Ghi tiền lãi hoặc tiền gốc mà không làm gián đoạn phần đối chiếu.</p>
        <dialog aria-labelledby="transaction-dialog-title" className="transaction-dialog" ref={paymentDialog} onCancel={(event) => { event.preventDefault(); closePaymentDialog(); }} onClick={(event) => { if (event.target === event.currentTarget) closePaymentDialog(); }}>
          <div className="dialog-heading"><div><p className="eyebrow">Nghiệp vụ khoản vay</p><h2 id="transaction-dialog-title">Ghi giao dịch</h2></div><button className="icon-button" type="button" aria-label="Đóng" onClick={closePaymentDialog}><X size={20} /></button></div>
          <form action={paymentAction} className="compact-form dialog-form">
          {context ? <p className="transaction-context"><strong>{context.name}</strong><span>Dư gốc {context.outstandingVnd} · Lãi còn lại {context.interestBalanceVnd}</span></p> : null}
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.payment} />
          <div className="field-group"><label htmlFor="paymentType">Loại tiền</label><select id="paymentType" name="type"><option value="INTEREST_PAYMENT">Tiền lãi</option><option value="PRINCIPAL_PAYMENT">Tiền gốc</option></select></div>
          <div className="field-group"><label htmlFor="paymentDate">Ngày thanh toán</label><input id="paymentDate" name="transactionDate" type="date" defaultValue={today} required /><FieldError state={paymentState} name="transactionDate" /></div>
          <div className="field-group"><label htmlFor="paymentAmount">Số tiền (VND)</label><VndInput id="paymentAmount" name="amountVnd" required placeholder="1.000.000" /><FieldError state={paymentState} name="amountVnd" /></div>
          <div className="field-group"><label htmlFor="paymentNote">Ghi chú</label><input id="paymentNote" name="note" maxLength={500} /></div>
          <ActionMessage state={paymentState} /><div className="dialog-actions"><button className="secondary-button" type="button" onClick={closePaymentDialog}>Hủy</button><FormSubmit>Ghi nhận</FormSubmit></div>
          </form>
        </dialog>
      </div> : null}

      {mode === "management" ? <div className="management-group-heading"><p className="eyebrow">Điều chỉnh</p><h2>Nghiệp vụ ít dùng</h2><span>Chi phí, lãi suất và trạng thái nợ xấu.</span></div> : null}

      {mode !== "payment" ? <details className="action-drawer">
        <summary>Thêm chi phí</summary>
        <form action={expenseAction} className="compact-form">
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.expense} />
          <div className="field-group"><label htmlFor="expenseDate">Ngày chi</label><input id="expenseDate" name="transactionDate" type="date" defaultValue={today} required /></div>
          <div className="field-group"><label htmlFor="expenseAmount">Số tiền (VND)</label><VndInput id="expenseAmount" name="amountVnd" required /></div>
          <div className="field-group"><label htmlFor="expenseCategory">Nhóm chi phí</label><input id="expenseCategory" name="category" required placeholder="Ví dụ: Đi lại" /></div>
          <div className="field-group"><label htmlFor="expenseNote">Ghi chú</label><input id="expenseNote" name="note" maxLength={500} /></div>
          <ActionMessage state={expenseState} /><FormSubmit>Ghi chi phí</FormSubmit>
        </form>
      </details> : null}

      {mode !== "payment" ? <details className="action-drawer">
        <summary>{status === "BAD_DEBT" ? "Bật lại tính lãi" : "Lãi suất / nợ xấu"}</summary>
        <form action={lifecycleAction} className="compact-form">
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.lifecycle} />
          <div className="field-group"><label htmlFor="eventType">Thao tác</label><select id="eventType" name="eventType" value={eventType} onChange={(event) => setEventType(event.target.value as typeof eventType)}>{status !== "BAD_DEBT" ? <><option value="RATE_CHANGE">Đổi lãi suất</option><option value="BAD_DEBT_START">Chuyển nợ xấu, ngừng lãi</option></> : <option value="INTEREST_RESUME">Bật lại tính lãi</option>}</select></div>
          <div className="field-group"><label htmlFor="effectiveDate">{eventType === "BAD_DEBT_START" ? "Ngày cuối cùng còn tính lãi" : "Ngày hiệu lực"}</label><input id="effectiveDate" name="effectiveDate" type="date" defaultValue={today} required aria-describedby="effective-date-hint" /><p className="field-hint" id="effective-date-hint">{eventType === "BAD_DEBT_START" ? "Ngày này vẫn được tính lãi; hệ thống ngừng phát sinh lãi từ ngày kế tiếp. Nếu kỳ cuối chưa đóng nhưng vẫn phải thu đủ, hãy chọn ngày kết thúc kỳ đó." : eventType === "INTEREST_RESUME" ? "Hệ thống bắt đầu tính lãi trở lại từ đầu ngày này." : "Lãi suất mới áp dụng từ đầu ngày này. Muốn giữ nguyên kỳ đã đóng, hãy chọn ngày đầu kỳ kế tiếp."}</p></div>
          <div className="field-group"><label htmlFor="newRate">Lãi suất mới (%/{interestCycleDays} ngày)</label><input id="newRate" name="periodRatePercent" inputMode="decimal" placeholder="Để trống khi chuyển nợ xấu" aria-describedby="new-rate-hint" /><p className="field-hint" id="new-rate-hint">Nhập phần trăm của cả kỳ {interestCycleDays} ngày.</p><FieldError state={lifecycleState} name="periodRatePercent" /></div>
          <div className="field-group"><label htmlFor="eventNote">Ghi chú</label><input id="eventNote" name="note" maxLength={500} /></div>
          <ActionMessage state={lifecycleState} /><FormSubmit>Cập nhật</FormSubmit>
        </form>
      </details> : null}

      {mode === "management" ? <div className="management-group-heading danger-group-heading"><p className="eyebrow">Thao tác quan trọng</p><h2>Kết thúc khoản vay</h2><span>Kiểm tra kỹ ngày và xác nhận trước khi thực hiện.</span></div> : null}

      {mode !== "payment" ? <details className="action-drawer danger-drawer">
        <summary>Tất toán khoản vay</summary>
        <form action={settlementAction} className="compact-form">
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.settlement} />
          <div className="field-group"><label htmlFor="settlementDate">Ngày tất toán</label><input id="settlementDate" name="settlementDate" type="date" defaultValue={today} required /></div>
          <div className="field-group"><label htmlFor="settlementNote">Ghi chú</label><input id="settlementNote" name="note" maxLength={500} /></div>
          <label className="confirmation-field"><input type="checkbox" required /><span>Tôi xác nhận hệ thống sẽ ghi toàn bộ gốc và lãi còn lại tại ngày tất toán.</span></label>
          <ActionMessage state={settlementState} /><FormSubmit danger>Tất toán toàn bộ</FormSubmit>
        </form>
      </details> : null}
    </section>
  );
}

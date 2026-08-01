"use client";

import { useActionState } from "react";
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

type Keys = { payment: string; expense: string; lifecycle: string; settlement: string };

export function LoanActions({ loanId, status, keys }: { loanId: string; status: LoanStatus; keys: Keys }) {
  const [paymentState, paymentAction] = useActionState(recordPaymentAction, initialBusinessActionState);
  const [expenseState, expenseAction] = useActionState(recordExpenseAction, initialBusinessActionState);
  const [lifecycleState, lifecycleAction] = useActionState(recordLifecycleAction, initialBusinessActionState);
  const [settlementState, settlementAction] = useActionState(settleLoanAction, initialBusinessActionState);
  const today = todayInVietnam();
  const isSettled = status === "SETTLED";

  if (isSettled) return <div className="settled-notice">Khoản vay đã tất toán. Chỉ còn xem lịch sử và đảo giao dịch hợp lệ.</div>;

  return (
    <section className="action-drawer-grid" aria-label="Ghi nhận nghiệp vụ">
      <details className="action-drawer" open>
        <summary>Ghi nhận thanh toán</summary>
        <form action={paymentAction} className="compact-form">
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.payment} />
          <div className="field-group"><label htmlFor="paymentType">Loại tiền</label><select id="paymentType" name="type"><option value="INTEREST_PAYMENT">Tiền lãi</option><option value="PRINCIPAL_PAYMENT">Tiền gốc</option></select></div>
          <div className="field-group"><label htmlFor="paymentDate">Ngày thanh toán</label><input id="paymentDate" name="transactionDate" type="date" defaultValue={today} required /><FieldError state={paymentState} name="transactionDate" /></div>
          <div className="field-group"><label htmlFor="paymentAmount">Số tiền (VND)</label><input id="paymentAmount" name="amountVnd" inputMode="numeric" required placeholder="1000000" /><FieldError state={paymentState} name="amountVnd" /></div>
          <div className="field-group"><label htmlFor="paymentNote">Ghi chú</label><input id="paymentNote" name="note" maxLength={500} /></div>
          <ActionMessage state={paymentState} /><FormSubmit>Ghi nhận</FormSubmit>
        </form>
      </details>

      <details className="action-drawer">
        <summary>Thêm chi phí</summary>
        <form action={expenseAction} className="compact-form">
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.expense} />
          <div className="field-group"><label htmlFor="expenseDate">Ngày chi</label><input id="expenseDate" name="transactionDate" type="date" defaultValue={today} required /></div>
          <div className="field-group"><label htmlFor="expenseAmount">Số tiền (VND)</label><input id="expenseAmount" name="amountVnd" inputMode="numeric" required /></div>
          <div className="field-group"><label htmlFor="expenseCategory">Nhóm chi phí</label><input id="expenseCategory" name="category" required placeholder="Ví dụ: Đi lại" /></div>
          <div className="field-group"><label htmlFor="expenseNote">Ghi chú</label><input id="expenseNote" name="note" maxLength={500} /></div>
          <ActionMessage state={expenseState} /><FormSubmit>Ghi chi phí</FormSubmit>
        </form>
      </details>

      <details className="action-drawer">
        <summary>{status === "BAD_DEBT" ? "Bật lại tính lãi" : "Lãi suất / nợ xấu"}</summary>
        <form action={lifecycleAction} className="compact-form">
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.lifecycle} />
          <div className="field-group"><label htmlFor="eventType">Thao tác</label><select id="eventType" name="eventType" defaultValue={status === "BAD_DEBT" ? "INTEREST_RESUME" : "RATE_CHANGE"}>{status !== "BAD_DEBT" ? <><option value="RATE_CHANGE">Đổi lãi suất</option><option value="BAD_DEBT_START">Chuyển nợ xấu, ngừng lãi</option></> : <option value="INTEREST_RESUME">Bật lại tính lãi</option>}</select></div>
          <div className="field-group"><label htmlFor="effectiveDate">Ngày hiệu lực</label><input id="effectiveDate" name="effectiveDate" type="date" defaultValue={today} required /></div>
          <div className="field-group"><label htmlFor="newRate">Lãi suất mới (%/ngày)</label><input id="newRate" name="dailyRatePercent" inputMode="decimal" placeholder="Để trống khi chuyển nợ xấu" /><FieldError state={lifecycleState} name="dailyRatePercent" /></div>
          <div className="field-group"><label htmlFor="eventNote">Ghi chú</label><input id="eventNote" name="note" maxLength={500} /></div>
          <ActionMessage state={lifecycleState} /><FormSubmit>Cập nhật</FormSubmit>
        </form>
      </details>

      <details className="action-drawer danger-drawer">
        <summary>Tất toán khoản vay</summary>
        <form action={settlementAction} className="compact-form" onSubmit={(event) => { if (!window.confirm("Tất toán sẽ tự ghi toàn bộ gốc và lãi còn lại. Bạn chắc chắn tiếp tục?")) event.preventDefault(); }}>
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={keys.settlement} />
          <div className="field-group"><label htmlFor="settlementDate">Ngày tất toán</label><input id="settlementDate" name="settlementDate" type="date" defaultValue={today} required /></div>
          <div className="field-group"><label htmlFor="settlementNote">Ghi chú</label><input id="settlementNote" name="note" maxLength={500} /></div>
          <ActionMessage state={settlementState} /><FormSubmit danger>Tất toán toàn bộ</FormSubmit>
        </form>
      </details>
    </section>
  );
}

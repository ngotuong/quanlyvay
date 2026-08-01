"use client";

import { useActionState } from "react";
import { createLoanAction, updateLoanAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import type { Counterparty, Loan } from "@/lib/business/types";
import { todayInVietnam } from "@/lib/business/format";
import { ActionMessage, FieldError, FormSubmit } from "./form-parts";

export function LoanForm({
  counterparties,
  idempotencyKey,
  loan,
}: {
  counterparties: Counterparty[];
  idempotencyKey: string;
  loan?: Loan;
}) {
  const [state, action] = useActionState(loan ? updateLoanAction : createLoanAction, initialBusinessActionState);
  const suffix = loan?.id ?? "new";

  return (
    <form action={action} className="business-form loan-form">
      {loan ? <input name="loanId" type="hidden" value={loan.id} /> : <input name="idempotencyKey" type="hidden" value={idempotencyKey} />}
      <div className="form-grid two-columns">
        <div className="field-group form-span-2">
          <label htmlFor={`loan-name-${suffix}`}>Tên khoản vay <span aria-hidden="true">*</span></label>
          <input id={`loan-name-${suffix}`} name="name" defaultValue={loan?.name} required maxLength={120} placeholder="Ví dụ: Khoản vay anh Nam tháng 8" />
          <FieldError state={state} name="name" />
        </div>
        <div className="field-group">
          <label htmlFor={`loan-counterparty-${suffix}`}>Đối tác <span aria-hidden="true">*</span></label>
          <select id={`loan-counterparty-${suffix}`} name="counterpartyId" defaultValue={loan?.counterparty_id} required>
            <option value="">Chọn đối tác</option>
            {counterparties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <FieldError state={state} name="counterpartyId" />
        </div>
        {!loan ? (
          <>
            <fieldset className="field-group segmented-field">
              <legend>Loại khoản vay <span aria-hidden="true">*</span></legend>
              <div className="segmented-control">
                <label><input defaultChecked name="direction" type="radio" value="LENDING" /><span>Cho vay</span></label>
                <label><input name="direction" type="radio" value="BORROWING" /><span>Đi vay</span></label>
              </div>
            </fieldset>
            <div className="field-group">
              <label htmlFor="originalPrincipalVnd">Số tiền gốc (VND) <span aria-hidden="true">*</span></label>
              <input id="originalPrincipalVnd" name="originalPrincipalVnd" inputMode="numeric" placeholder="100000000" required />
              <FieldError state={state} name="originalPrincipalVnd" />
            </div>
            <div className="field-group">
              <label htmlFor="disbursementDate">Ngày giải ngân <span aria-hidden="true">*</span></label>
              <input id="disbursementDate" name="disbursementDate" type="date" defaultValue={todayInVietnam()} required />
              <FieldError state={state} name="disbursementDate" />
            </div>
            <div className="field-group">
              <label htmlFor="termDays">Số ngày vay <span aria-hidden="true">*</span></label>
              <input id="termDays" name="termDays" type="number" inputMode="numeric" min={1} max={36500} defaultValue={30} required />
              <p className="field-hint">Ngày đáo hạn được tính gồm cả ngày giải ngân.</p>
              <FieldError state={state} name="termDays" />
            </div>
            <div className="field-group">
              <label htmlFor="interestCycleDays">Chu kỳ đóng lãi <span aria-hidden="true">*</span></label>
              <select id="interestCycleDays" name="interestCycleDays" defaultValue="30"><option value="15">15 ngày</option><option value="30">30 ngày</option></select>
              <FieldError state={state} name="interestCycleDays" />
            </div>
            <div className="field-group">
              <label htmlFor="initialDailyRatePercent">Lãi suất (%/ngày) <span aria-hidden="true">*</span></label>
              <input id="initialDailyRatePercent" name="initialDailyRatePercent" inputMode="decimal" defaultValue="0.1" required />
              <FieldError state={state} name="initialDailyRatePercent" />
            </div>
          </>
        ) : null}
        <div className="field-group form-span-2">
          <label htmlFor={`loan-notes-${suffix}`}>Ghi chú</label>
          <textarea id={`loan-notes-${suffix}`} name="notes" defaultValue={loan?.notes ?? ""} maxLength={500} rows={4} />
          <FieldError state={state} name="notes" />
        </div>
      </div>
      <ActionMessage state={state} />
      <FormSubmit>{loan ? "Lưu thông tin" : "Tạo khoản vay"}</FormSubmit>
    </form>
  );
}

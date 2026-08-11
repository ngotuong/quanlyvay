"use client";

import { useActionState } from "react";
import { correctLoanTermsAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { periodRateInput } from "@/lib/business/format";
import type { Loan } from "@/lib/business/types";
import { ActionMessage, FieldError, FormSubmit } from "./form-parts";
import { VndInput } from "./vnd-input";

export function LoanCorrectionForm({ loan, idempotencyKey }: { loan: Loan; idempotencyKey: string }) {
  const [state, action] = useActionState(correctLoanTermsAction, initialBusinessActionState);

  return (
    <form action={action} className="business-form correction-form">
      <input name="loanId" type="hidden" value={loan.id} />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <div className="correction-notice" role="note">
        Chỉ dùng khi dữ liệu ban đầu được nhập sai. Hệ thống sẽ giữ giao dịch cũ, tạo giao dịch đảo và tính lại toàn bộ lịch lãi.
      </div>
      <div className="form-grid two-columns">
        <fieldset className="field-group segmented-field form-span-2">
          <legend>Loại khoản vay <span aria-hidden="true">*</span></legend>
          <div className="segmented-control">
            <label><input defaultChecked={loan.direction === "LENDING"} name="direction" type="radio" value="LENDING" /><span>Cho vay</span></label>
            <label><input defaultChecked={loan.direction === "BORROWING"} name="direction" type="radio" value="BORROWING" /><span>Đi vay</span></label>
          </div>
        </fieldset>
        <div className="field-group">
          <label htmlFor="correctionPrincipal">Số tiền gốc ban đầu (VND) <span aria-hidden="true">*</span></label>
          <VndInput id="correctionPrincipal" name="originalPrincipalVnd" defaultValue={loan.original_principal_vnd} required />
          <FieldError state={state} name="originalPrincipalVnd" />
        </div>
        <div className="field-group">
          <label htmlFor="correctionDate">Ngày giải ngân <span aria-hidden="true">*</span></label>
          <input id="correctionDate" name="disbursementDate" type="date" defaultValue={loan.disbursement_date} required />
          <FieldError state={state} name="disbursementDate" />
        </div>
        <fieldset className="field-group segmented-field form-span-2">
          <legend>Thời hạn khoản vay</legend>
          <div className="segmented-control">
            <label><input defaultChecked={loan.term_days === null} name="maturityOption" type="radio" value="none" /><span>Không đáo hạn</span></label>
            <label><input defaultChecked={loan.term_days !== null} name="maturityOption" type="radio" value="fixed" /><span>Có đáo hạn</span></label>
          </div>
          <p className="field-hint">Không đáo hạn: tiếp tục tính kỳ lãi theo chu kỳ cho đến khi tất toán.</p>
        </fieldset>
        <div className="field-group">
          <label htmlFor="correctionTerm">Số ngày vay (nếu có đáo hạn)</label>
          <input id="correctionTerm" name="termDays" type="number" min={1} max={36500} defaultValue={loan.term_days ?? ""} placeholder="Ví dụ: 90" />
          <FieldError state={state} name="termDays" />
        </div>
        <div className="field-group">
          <label htmlFor="correctionCycle">Chu kỳ đóng lãi <span aria-hidden="true">*</span></label>
          <select id="correctionCycle" name="interestCycleDays" defaultValue={String(loan.interest_cycle_days)}><option value="15">15 ngày</option><option value="30">30 ngày</option></select>
          <FieldError state={state} name="interestCycleDays" />
        </div>
        <div className="field-group form-span-2">
          <label htmlFor="correctionRate">Lãi suất mỗi kỳ (%) <span aria-hidden="true">*</span></label>
          <input id="correctionRate" name="initialPeriodRatePercent" inputMode="decimal" defaultValue={periodRateInput(loan.initial_daily_rate_percent, loan.interest_cycle_days)} required aria-describedby="correction-rate-hint" />
          <p className="field-hint" id="correction-rate-hint">Mức lãi của cả chu kỳ đang chọn; hệ thống tự quy đổi sang lãi theo ngày.</p>
          <FieldError state={state} name="initialPeriodRatePercent" />
        </div>
        <div className="field-group form-span-2">
          <label htmlFor="correctionReason">Lý do điều chỉnh <span aria-hidden="true">*</span></label>
          <textarea id="correctionReason" name="reason" maxLength={500} rows={3} required placeholder="Ví dụ: Nhập nhầm số tiền gốc khi tạo khoản vay" />
          <FieldError state={state} name="reason" />
        </div>
        <label className="confirmation-field form-span-2">
          <input name="confirmation" type="checkbox" value="confirmed" required />
          <span>Tôi đã kiểm tra lại dữ liệu và hiểu rằng hệ thống sẽ tính lại lịch lãi.</span>
        </label>
        <FieldError state={state} name="confirmation" />
      </div>
      <ActionMessage state={state} />
      <FormSubmit>Áp dụng điều chỉnh</FormSubmit>
    </form>
  );
}

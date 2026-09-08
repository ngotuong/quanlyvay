"use client";
import { useBusinessAction } from "./use-business-action";

import { useState } from "react";
import { createLoanAction, updateLoanAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import type { Counterparty, Loan } from "@/lib/business/types";
import { todayInVietnam } from "@/lib/business/format";
import { BusinessForm, ActionMessage, FieldError, FormSubmit } from "./form-parts";
import { CounterpartyPicker } from "./counterparty-picker";
import { VndInput } from "./vnd-input";

export function LoanForm({
  counterparties,
  idempotencyKey,
  loan,
}: {
  counterparties: Counterparty[];
  idempotencyKey: string;
  loan?: Loan;
}) {
  const [state, action] = useBusinessAction(loan ? updateLoanAction : createLoanAction, initialBusinessActionState);
  const [maturity, setMaturity] = useState("none");
  const [cycle, setCycle] = useState(loan?.interest_cycle_days ?? 30);
  const suffix = loan?.id ?? "new";

  return (
    <BusinessForm state={state} action={action} className="business-form loan-form">
      {loan ? <input name="loanId" type="hidden" value={loan.id} /> : <input name="idempotencyKey" type="hidden" value={idempotencyKey} />}
      <div className="form-grid two-columns">
        {!loan ? <fieldset className="field-group segmented-field form-span-2">
              <legend>Loại khoản vay <span aria-hidden="true">*</span></legend>
              <div className="segmented-control">
                <label><input name="direction" required type="radio" value="LENDING" /><span>Cho vay</span></label>
                <label><input name="direction" required type="radio" value="BORROWING" /><span>Đi vay</span></label>
              </div>
              <FieldError state={state} name="direction" />
            </fieldset> : null}
        <div className="field-group">
          <label htmlFor={`loan-counterparty-${suffix}`}>Đối tác <span aria-hidden="true">*</span></label>
          <CounterpartyPicker items={counterparties} id={`loan-counterparty-${suffix}`} defaultValue={loan?.counterparty_id} />
          <FieldError state={state} name="counterpartyId" />
        </div>
        {!loan ? (
          <>

            <div className="field-group">
              <label htmlFor="originalPrincipalVnd">Số tiền gốc (VND) <span aria-hidden="true">*</span></label>
              <VndInput id="originalPrincipalVnd" name="originalPrincipalVnd" placeholder="100.000.000" required />
              <FieldError state={state} name="originalPrincipalVnd" />
            </div>
            <div className="field-group">
              <label htmlFor="disbursementDate">Ngày giải ngân <span aria-hidden="true">*</span></label>
              <input id="disbursementDate" name="disbursementDate" type="date" defaultValue={todayInVietnam()} required />
              <FieldError state={state} name="disbursementDate" />
            </div>
            <div className="field-group">
              <label htmlFor="interestCycleDays">Chu kỳ đóng lãi <span aria-hidden="true">*</span></label>
              <select id="interestCycleDays" name="interestCycleDays" value={cycle} onChange={event => setCycle(Number(event.target.value) as 15 | 30)}><option value="15">15 ngày</option><option value="30">30 ngày</option></select>
              <FieldError state={state} name="interestCycleDays" />
            </div>
            <div className="field-group">
              <label htmlFor="initialPeriodRatePercent">Lãi suất mỗi kỳ (%) <span aria-hidden="true">*</span></label>
              <input id="initialPeriodRatePercent" name="initialPeriodRatePercent" inputMode="decimal" defaultValue="3" required aria-describedby="initial-period-rate-hint" />
              <p className="field-hint" id="initial-period-rate-hint">Ví dụ nhập 3 nghĩa là 3% cho chu kỳ đã chọn. Hệ thống tự quy đổi để tính chính xác theo ngày.</p>
              <FieldError state={state} name="initialPeriodRatePercent" />
            </div>
            <fieldset className="field-group segmented-field form-span-2">
              <legend>Thời hạn khoản vay</legend>
              <div className="segmented-control">
                <label><input checked={maturity === "none"} onChange={() => setMaturity("none")} name="maturityOption" type="radio" value="none" /><span>Không đáo hạn</span></label>
                <label><input checked={maturity === "fixed"} onChange={() => setMaturity("fixed")} name="maturityOption" type="radio" value="fixed" /><span>Có đáo hạn</span></label>
              </div>
              <FieldError state={state} name="maturityOption" />
              <p className="field-hint">Khoản không đáo hạn tiếp tục tính kỳ lãi cho đến khi tất toán.</p>
            </fieldset>
            {maturity === "fixed" ? <div className="field-group">
              <label htmlFor="termDays">Số ngày vay (nếu có đáo hạn)</label>
              <input id="termDays" name="termDays" required type="number" inputMode="numeric" min={1} max={36500} placeholder="Ví dụ: 90" />
              <p className="field-hint">Ngày đáo hạn được tính gồm cả ngày giải ngân.</p>
              <FieldError state={state} name="termDays" />
            </div> : <input name="termDays" type="hidden" value="" />}
            <div className="field-group form-span-2">
              <label htmlFor="interestReminderOffsetDays">Nhắc thu lãi sớm hơn (ngày)</label>
              <input id="interestReminderOffsetDays" name="interestReminderOffsetDays" type="number" min={0} max={cycle - 1} defaultValue="0" required />
              <p className="field-hint">Khoản mới để 0. Khoản theo sổ cũ có thể nhập 1; tiền lãi vẫn tính đủ chu kỳ.</p>
              <FieldError state={state} name="interestReminderOffsetDays" />
            </div>
          </>
        ) : <div className="field-group form-span-2">
          <label htmlFor={`loan-reminder-${suffix}`}>Nhắc thu lãi sớm hơn (ngày)</label>
          <input id={`loan-reminder-${suffix}`} name="interestReminderOffsetDays" type="number" min={0} max={loan.interest_cycle_days - 1} defaultValue={loan.interest_reminder_offset_days} required />
          <p className="field-hint">Chỉ thay đổi ngày nhắc thu; số ngày và tiền lãi của kỳ không đổi.</p>
          <FieldError state={state} name="interestReminderOffsetDays" />
        </div>}
        <div className="field-group form-span-2">
          <label htmlFor={`loan-name-${suffix}`}>Nhãn phân biệt (không bắt buộc)</label>
          <input id={`loan-name-${suffix}`} name="name" defaultValue={loan?.name} maxLength={120} placeholder="Để trống để hệ thống tự đặt" />
          <p className="field-hint">Chỉ cần nhập khi bạn muốn một tên dễ nhớ; hệ thống vẫn phân biệt các khoản vay bằng mã riêng.</p>
          <FieldError state={state} name="name" />
        </div>
        <div className="field-group form-span-2">
          <label htmlFor={`loan-notes-${suffix}`}>Ghi chú</label>
          <textarea id={`loan-notes-${suffix}`} name="notes" defaultValue={loan?.notes ?? ""} maxLength={500} rows={4} />
          <FieldError state={state} name="notes" />
        </div>
      </div>
      <ActionMessage state={state} hiddenFields={maturity === "none" ? ["termDays"] : []} />
      <FormSubmit>{loan ? "Lưu thông tin" : "Tạo khoản vay"}</FormSubmit>
    </BusinessForm>
  );
}

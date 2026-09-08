"use client";
import { useBusinessAction } from "./use-business-action";

import { useState } from "react";
import { recordPaymentAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { formatDate } from "@/lib/business/format";
import { BusinessForm, ActionMessage, FieldError, FormSubmit } from "./form-parts";
import { VndInput } from "./vnd-input";

type PeriodInterestPaymentFormProps = {
  loanId: string;
  periodId: string;
  startDate: string;
  endDate: string;
  defaultPaymentDate: string;
  amountVnd: string;
  canPay: boolean;
  idempotencyKey: string;
};


export function PeriodInterestPaymentForm({
  loanId,
  periodId,
  startDate,
  endDate,
  defaultPaymentDate,
  amountVnd,
  canPay,
  idempotencyKey,
}: PeriodInterestPaymentFormProps) {
  const [state, action] = useBusinessAction(recordPaymentAction, initialBusinessActionState);
  const [paymentDate, setPaymentDate] = useState(defaultPaymentDate);
  const outsidePeriod = paymentDate !== "" && (paymentDate < startDate || paymentDate > endDate);
  const inputSuffix = periodId.replaceAll("-", "");

  if (!canPay) {
    return (
      <>
        <ActionMessage state={state} />
        <p className="period-paid-status">Đã đóng đủ</p>
      </>
    );
  }

  return (
    <details className="period-payment">
      <summary className="flex items-center justify-between">
        <span>Ghi nhận đóng lãi</span>
      </summary>
      <BusinessForm state={state} action={action} className="compact-form">
        <input name="loanId" type="hidden" value={loanId} />
        <input name="type" type="hidden" value="INTEREST_PAYMENT" />
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <div className="field-group">
          <label htmlFor={`periodPaymentDate-${inputSuffix}`}>Ngày thanh toán</label>
          <input
            id={`periodPaymentDate-${inputSuffix}`}
            name="transactionDate"
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            aria-describedby={`periodPaymentDateHint-${inputSuffix}`}
            required
          />
          <p className="field-hint" id={`periodPaymentDateHint-${inputSuffix}`}>
            Mặc định là ngày dự kiến thu của kỳ; bạn có thể sửa theo ngày thực tế.
          </p>
          {outsidePeriod ? (
            <p className="period-payment-warning" role="status">
              Ngày này nằm ngoài kỳ {formatDate(startDate)} – {formatDate(endDate)}. Giao dịch sẽ
              được hiển thị ở kỳ chứa ngày thanh toán thực tế.
            </p>
          ) : null}
          <FieldError state={state} name="transactionDate" />
        </div>
        <div className="field-group">
          <label htmlFor={`periodPaymentAmount-${inputSuffix}`}>Số tiền (VND)</label>
          <VndInput
            id={`periodPaymentAmount-${inputSuffix}`}
            name="amountVnd"
            defaultValue={amountVnd}
            required
          />
          <p className="field-hint">Đã điền số dư lãi còn phải đóng đến cuối kỳ. Có thể sửa số tiền thực tế.</p>
          <FieldError state={state} name="amountVnd" />
        </div>
        <div className="field-group">
          <label htmlFor={`periodPaymentNote-${inputSuffix}`}>Ghi chú</label>
          <input
            id={`periodPaymentNote-${inputSuffix}`}
            name="note"
            maxLength={500}
            defaultValue={`Đóng lãi kỳ ${formatDate(startDate)} – ${formatDate(endDate)}`}
          />
          <FieldError state={state} name="note" />
        </div>
        <ActionMessage state={state} />
        <FormSubmit>Ghi nhận đóng lãi</FormSubmit>
      </BusinessForm>
    </details>
  );
}

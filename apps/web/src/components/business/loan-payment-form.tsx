"use client";

import { useState, type ReactNode } from "react";
import { recordPaymentAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { todayInVietnam } from "@/lib/business/format";
import { Button, Input, Select, VndInput } from "@/components/ui";
import { ActionMessage, BusinessForm, FieldError, FormSubmit } from "./form-parts";
import { useBusinessAction } from "./use-business-action";

type PaymentType = "INTEREST_PAYMENT" | "PRINCIPAL_PAYMENT";
type Props = {
  loanId: string;
  idempotencyKey: string;
  context?: ReactNode;
  initialPayment?: { type: PaymentType; amountVnd: string };
  principalOutstandingVnd?: string;
  suggestedInterestVnd?: string;
  onDateChange?: (date: string) => void;
  canSubmit?: boolean;
  registerNavigationDraft?: boolean;
  onDirtyChange: (dirty: boolean) => void;
  onPendingChange: (pending: boolean) => void;
  onSuccess: (message: string) => void;
  onCancel: () => void;
};

export function LoanPaymentForm({ loanId, idempotencyKey, context, initialPayment, principalOutstandingVnd, suggestedInterestVnd, onDateChange, canSubmit = true, registerNavigationDraft = true, onDirtyChange, onPendingChange, onSuccess, onCancel }: Props) {
  const [state, action] = useBusinessAction(recordPaymentAction, initialBusinessActionState);
  const initialType = initialPayment?.type ?? "INTEREST_PAYMENT";
  const [paymentType, setPaymentType] = useState<PaymentType>(initialType);
  return <BusinessForm state={state} action={action} className="compact-form dialog-form"
    registerNavigationDraft={registerNavigationDraft} onDirtyChange={onDirtyChange} onPendingChange={onPendingChange} onSuccess={onSuccess}
    onSubmit={event => { if (!canSubmit) event.preventDefault(); }}
    onReset={() => setPaymentType(initialType)}>
    <div className="payment-fields">
      {context}
      <input name="loanId" type="hidden" value={loanId} />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <div className="field-group"><label htmlFor="paymentType">Loại tiền</label><Select id="paymentType" name="type" value={paymentType} onChange={event => setPaymentType(event.target.value as PaymentType)}><option value="INTEREST_PAYMENT">Tiền lãi</option><option value="PRINCIPAL_PAYMENT">Tiền gốc</option></Select><FieldError state={state} name="type" /></div>
      <div className="field-group"><label htmlFor="paymentDate">Ngày thanh toán</label><Input id="paymentDate" name="transactionDate" type="date" defaultValue={todayInVietnam()} required onChange={event => onDateChange?.(event.target.value)} /><FieldError state={state} name="transactionDate" /></div>
      <div className="field-group"><label htmlFor="paymentAmount">Số tiền (VND)</label><VndInput id="paymentAmount" name="amountVnd" required placeholder="1.000.000" defaultValue={initialPayment?.amountVnd} quickAmounts={paymentType === "PRINCIPAL_PAYMENT" ? { maximumVnd: principalOutstandingVnd } : undefined} suggestedAmountVnd={paymentType === "INTEREST_PAYMENT" ? suggestedInterestVnd : undefined} /><FieldError state={state} name="amountVnd" /></div>
      <div className="field-group"><label htmlFor="paymentNote">Ghi chú</label><Input id="paymentNote" name="note" maxLength={500} /><FieldError state={state} name="note" /></div>
      <ActionMessage state={state} />
    </div>
    <div className="dialog-actions"><Button variant="secondary" className="secondary-button" type="button" disabled={state.pending} onClick={onCancel}>Hủy</Button><FormSubmit disabled={!canSubmit}>Ghi nhận</FormSubmit></div>
  </BusinessForm>;
}

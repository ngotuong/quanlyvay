"use client";
import { useBusinessAction } from "./use-business-action";

import { recordExpenseAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { todayInVietnam } from "@/lib/business/format";
import { BusinessForm, ActionMessage, FieldError, FormSubmit, type BusinessFormProps } from "./form-parts";
import { VndInput } from "./vnd-input";
import { DateInput } from "@/components/ui";

export function GeneralExpenseForm({ idempotencyKey, ...lifecycle }: { idempotencyKey: string } & Pick<BusinessFormProps, "onDirtyChange" | "onPendingChange" | "onSuccess">) {
  const [state, action] = useBusinessAction(recordExpenseAction, initialBusinessActionState);

  return (
    <BusinessForm {...lifecycle} state={state} action={action} className="business-form">
      <input name="loanId" type="hidden" value="" />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <div className="field-group">
        <label htmlFor="general-expense-date">Ngày chi</label>
        <DateInput id="general-expense-date" name="transactionDate" defaultValue={todayInVietnam()} required />
        <FieldError state={state} name="transactionDate" />
      </div>
      <div className="field-group">
        <label htmlFor="general-expense-amount">Số tiền (VND)</label>
        <VndInput id="general-expense-amount" name="amountVnd" required />
        <FieldError state={state} name="amountVnd" />
      </div>
      <div className="field-group">
        <label htmlFor="general-expense-category">Nhóm chi phí</label>
        <input id="general-expense-category" name="category" maxLength={80} required placeholder="Ví dụ: Vận hành" />
        <FieldError state={state} name="category" />
      </div>
      <div className="field-group">
        <label htmlFor="general-expense-note">Ghi chú</label>
        <textarea id="general-expense-note" name="note" maxLength={500} rows={3} />
        <FieldError state={state} name="note" />
      </div>
      <ActionMessage state={state} />
      <FormSubmit>Ghi chi phí chung</FormSubmit>
    </BusinessForm>
  );
}

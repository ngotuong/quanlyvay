"use client";

import { useActionState } from "react";
import { recordExpenseAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { todayInVietnam } from "@/lib/business/format";
import { ActionMessage, FieldError, FormSubmit } from "./form-parts";

export function GeneralExpenseForm({ idempotencyKey }: { idempotencyKey: string }) {
  const [state, action] = useActionState(recordExpenseAction, initialBusinessActionState);

  return (
    <form action={action} className="business-form">
      <input name="loanId" type="hidden" value="" />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <div className="field-group">
        <label htmlFor="general-expense-date">Ngày chi</label>
        <input id="general-expense-date" name="transactionDate" type="date" defaultValue={todayInVietnam()} required />
        <FieldError state={state} name="transactionDate" />
      </div>
      <div className="field-group">
        <label htmlFor="general-expense-amount">Số tiền (VND)</label>
        <input id="general-expense-amount" name="amountVnd" inputMode="numeric" required />
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
      </div>
      <ActionMessage state={state} />
      <FormSubmit>Ghi chi phí chung</FormSubmit>
    </form>
  );
}

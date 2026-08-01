"use client";

import { useActionState } from "react";
import { saveCounterpartyAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import type { Counterparty } from "@/lib/business/types";
import { ActionMessage, FieldError, FormSubmit } from "./form-parts";

export function CounterpartyForm({ counterparty }: { counterparty?: Counterparty }) {
  const [state, action] = useActionState(saveCounterpartyAction, initialBusinessActionState);
  return (
    <form action={action} className="business-form">
      {counterparty ? <input name="id" type="hidden" value={counterparty.id} /> : null}
      <div className="field-group">
        <label htmlFor={`counterparty-name-${counterparty?.id ?? "new"}`}>Tên đối tác <span aria-hidden="true">*</span></label>
        <input id={`counterparty-name-${counterparty?.id ?? "new"}`} name="name" defaultValue={counterparty?.name} maxLength={120} required />
        <FieldError state={state} name="name" />
      </div>
      <div className="field-group">
        <label htmlFor={`counterparty-notes-${counterparty?.id ?? "new"}`}>Ghi chú</label>
        <textarea id={`counterparty-notes-${counterparty?.id ?? "new"}`} name="notes" defaultValue={counterparty?.notes ?? ""} maxLength={500} rows={3} />
        <FieldError state={state} name="notes" />
      </div>
      <ActionMessage state={state} />
      <FormSubmit>{counterparty ? "Lưu thay đổi" : "Thêm đối tác"}</FormSubmit>
    </form>
  );
}

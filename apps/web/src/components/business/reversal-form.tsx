"use client";
import { useBusinessAction } from "./use-business-action";

import { reverseTransactionAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { todayInVietnam } from "@/lib/business/format";
import { BusinessForm, ActionMessage, FieldError, FormSubmit } from "./form-parts";
import { DateInput } from "@/components/ui";

export function ReversalForm({ loanId, transactionId, idempotencyKey }: { loanId: string | null; transactionId: string; idempotencyKey: string }) {
  const [state, action] = useBusinessAction(reverseTransactionAction, initialBusinessActionState);
  return (
    <details className="inline-reversal">
      <summary>Đảo giao dịch</summary>
      <BusinessForm state={state} action={action} className="compact-form" onSubmit={(event) => { if (!window.confirm("Giao dịch gốc sẽ được giữ lại và hệ thống tạo một giao dịch đảo. Tiếp tục?")) event.preventDefault(); }}>
        <input name="loanId" type="hidden" value={loanId ?? ""} />
        <input name="transactionId" type="hidden" value={transactionId} />
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <div className="field-group"><label htmlFor={`reverse-date-${transactionId}`}>Ngày đảo</label><DateInput id={`reverse-date-${transactionId}`} name="reversalDate" defaultValue={todayInVietnam()} required /><FieldError state={state} name="reversalDate" /></div>
        <div className="field-group"><label htmlFor={`reverse-note-${transactionId}`}>Lý do</label><input id={`reverse-note-${transactionId}`} name="note" maxLength={500} required /><FieldError state={state} name="note" /></div>
        <ActionMessage state={state} /><FormSubmit danger>Xác nhận đảo</FormSubmit>
      </BusinessForm>
    </details>
  );
}

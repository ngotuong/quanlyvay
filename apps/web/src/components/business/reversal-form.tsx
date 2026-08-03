"use client";

import { useActionState } from "react";
import { reverseTransactionAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { todayInVietnam } from "@/lib/business/format";
import { ActionMessage, FormSubmit } from "./form-parts";

export function ReversalForm({ loanId, transactionId, idempotencyKey }: { loanId: string | null; transactionId: string; idempotencyKey: string }) {
  const [state, action] = useActionState(reverseTransactionAction, initialBusinessActionState);
  return (
    <details className="inline-reversal">
      <summary>Đảo giao dịch</summary>
      <form action={action} className="compact-form" onSubmit={(event) => { if (!window.confirm("Giao dịch gốc sẽ được giữ lại và hệ thống tạo một giao dịch đảo. Tiếp tục?")) event.preventDefault(); }}>
        <input name="loanId" type="hidden" value={loanId ?? ""} />
        <input name="transactionId" type="hidden" value={transactionId} />
        <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
        <div className="field-group"><label>Ngày đảo</label><input name="reversalDate" type="date" defaultValue={todayInVietnam()} required /></div>
        <div className="field-group"><label>Lý do</label><input name="note" maxLength={500} required /></div>
        <ActionMessage state={state} /><FormSubmit danger>Xác nhận đảo</FormSubmit>
      </form>
    </details>
  );
}

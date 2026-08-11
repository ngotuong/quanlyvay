"use client";

import { useActionState } from "react";
import { reverseSettlementAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { todayInVietnam } from "@/lib/business/format";
import { ActionMessage, FieldError, FormSubmit } from "./form-parts";

export function SettlementReversalForm({ loanId, idempotencyKey }: { loanId: string; idempotencyKey: string }) {
  const [state, action] = useActionState(reverseSettlementAction, initialBusinessActionState);

  return (
    <section className="action-drawer-grid" aria-label="Hoàn tác tất toán">
      <details className="action-drawer danger-drawer">
        <summary>Hoàn tác toàn bộ tất toán</summary>
        <form action={action} className="compact-form" onSubmit={(event) => { if (!window.confirm("Hệ thống sẽ đảo đúng các khoản gốc/lãi do lần tất toán tạo ra và mở lại khoản vay. Tiếp tục?")) event.preventDefault(); }}>
          <input name="loanId" type="hidden" value={loanId} />
          <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
          <div className="field-group"><label htmlFor="settlementReversalDate">Ngày hoàn tác</label><input id="settlementReversalDate" name="reversalDate" type="date" defaultValue={todayInVietnam()} required /><FieldError state={state} name="reversalDate" /></div>
          <div className="field-group"><label htmlFor="settlementReversalReason">Lý do</label><input id="settlementReversalReason" name="reason" maxLength={500} required /><FieldError state={state} name="reason" /></div>
          <label className="confirmation-row"><input name="confirmation" type="checkbox" value="confirmed" required /> Tôi đã kiểm tra và muốn hoàn tác nguyên lần tất toán này.</label>
          <ActionMessage state={state} /><FormSubmit danger>Hoàn tác tất toán</FormSubmit>
        </form>
      </details>
    </section>
  );
}

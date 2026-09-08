"use client";
import { useBusinessAction } from "./use-business-action";

import { useEffect, useState } from "react";
import { settleLoanAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { formatDate, formatVnd, todayInVietnam } from "@/lib/business/format";
import { ActionMessage, BusinessForm, FieldError, FormSubmit } from "./form-parts";

export function SettlementForm({ loanId, idempotencyKey }: { loanId: string; idempotencyKey: string }) {
  const [state, action] = useBusinessAction(settleLoanAction, initialBusinessActionState);
  const [date, setDate] = useState(todayInVietnam());
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ error: string; preview: { date: string; principalVnd: string; interestVnd: string; totalVnd: string } | null } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    // Read-only previews must not join the Server Action mutation queue during a refresh.
    fetch(`/api/loans/${loanId}/settlement-preview?date=${encodeURIComponent(date)}`, { cache: "no-store", signal: controller.signal })
      .then(response => response.json()).then(value => { if (!controller.signal.aborted) setResult(value); })
      .catch(() => { if (!controller.signal.aborted) setResult({ error: "Mất kết nối. Hãy thử tải lại bảng tất toán.", preview: null }); });
    return () => controller.abort();
  }, [loanId, date, reload]);
  const preview = result?.preview;
  return <BusinessForm state={state} action={action} className="compact-form">
    <input name="loanId" type="hidden" value={loanId} /><input name="idempotencyKey" type="hidden" value={idempotencyKey} />
    <div className="field-group"><label htmlFor="settlementDate">Ngày tất toán</label><input id="settlementDate" name="settlementDate" type="date" value={date} required onChange={event => { setResult(null); setDate(event.target.value); }} /><FieldError state={state} name="settlementDate" /></div>
    {!result ? <p role="status">Đang tính số tiền tất toán…</p> : null}
    {result?.error ? <p role="alert">{result.error}</p> : null}
    <button className="secondary-button" type="button" onClick={() => { setResult(null); setReload(value => value+1); }}>Tải lại bảng tất toán</button>
    {preview ? <fieldset key={`${date}-${reload}`} className="settlement-preview"><legend>Số tiền tại {formatDate(preview.date)}</legend>
      <dl><div><dt>Gốc còn lại</dt><dd>{formatVnd(preview.principalVnd)}</dd></div><div><dt>Lãi còn lại</dt><dd>{formatVnd(preview.interestVnd)}</dd></div><div><dt>Tổng tất toán</dt><dd>{formatVnd(preview.totalVnd)}</dd></div></dl>
      <input type="hidden" name="expectedPrincipal" value={preview.principalVnd} /><input type="hidden" name="expectedInterest" value={preview.interestVnd} />
      <label className="confirmation-field"><input name="confirmation" type="checkbox" value="confirmed" required /><span>Tôi xác nhận hệ thống sẽ ghi toàn bộ gốc và lãi còn lại tại ngày tất toán.</span></label>
      <FieldError state={state} name="confirmation" />
    </fieldset> : null}
    <div className="field-group"><label htmlFor="settlementNote">Ghi chú</label><input id="settlementNote" name="note" maxLength={500} /><FieldError state={state} name="note" /></div>
    <ActionMessage state={state} />
    {preview ? <FormSubmit danger>Tất toán toàn bộ</FormSubmit> : <button className="danger-button" type="button" disabled>Tất toán toàn bộ</button>}
  </BusinessForm>;
}

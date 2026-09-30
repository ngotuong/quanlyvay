"use client";

import { useEffect, useMemo, useState } from "react";
import { restructureLoanPrincipalAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { formatDate, formatVnd, todayInVietnam } from "@/lib/business/format";
import type { PrincipalRestructurePreview } from "@/lib/business/types";
import { ActionMessage, BusinessForm, FieldError, FormSubmit } from "./form-parts";
import { VndInput } from "@/components/ui";
import { useBusinessAction } from "./use-business-action";

type PreviewResult = { error: string; preview: PrincipalRestructurePreview | null };

export function PrincipalRestructureForm({ loanId, idempotencyKey, onDirtyChange, onPendingChange, onSuccess }: {
  loanId: string;
  idempotencyKey: string;
  onDirtyChange?: (dirty: boolean) => void;
  onPendingChange?: (pending: boolean) => void;
  onSuccess?: (message: string) => void;
}) {
  const [state, action, , reset] = useBusinessAction(restructureLoanPrincipalAction, initialBusinessActionState);
  const [effectiveDate, setEffectiveDate] = useState(todayInVietnam());
  const [principalPaymentVnd, setPrincipalPaymentVnd] = useState("");
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<PreviewResult | null>(null);

  useEffect(() => {
    if (!/^\d+$/.test(principalPaymentVnd) || BigInt(principalPaymentVnd) <= BigInt(0)) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams({ effectiveDate, principalPaymentVnd });
      fetch(`/api/loans/${loanId}/principal-restructure-preview?${query}`, { cache: "no-store", signal: controller.signal })
        .then(response => response.json())
        .then(value => { if (!controller.signal.aborted) setResult(value); })
        .catch(() => { if (!controller.signal.aborted) setResult({ error: "Mất kết nối. Hãy thử tải lại phương án.", preview: null }); });
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [effectiveDate, loanId, principalPaymentVnd, reload]);

  const preview = result?.preview;
  const totalCashVnd = useMemo(() => preview
    ? (BigInt(preview.principalPaymentVnd) + BigInt(preview.interestToSettleVnd)).toString()
    : "0", [preview]);

  const hasPrincipal = principalPaymentVnd.length > 0;
  const validPrincipal = /^\d+$/.test(principalPaymentVnd) && BigInt(principalPaymentVnd) > BigInt(0);

  return <BusinessForm state={state} action={action} className="compact-form restructure-form" onDirtyChange={onDirtyChange} onPendingChange={onPendingChange} onSuccess={onSuccess}>
    <input name="loanId" type="hidden" value={loanId} />
    <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
    <div className="field-group">
      <label htmlFor="restructureEffectiveDate">Dư gốc mới có hiệu lực từ ngày</label>
      <input id="restructureEffectiveDate" name="effectiveDate" type="date" value={effectiveDate} max={todayInVietnam()} required onChange={event => { setResult(null); setEffectiveDate(event.target.value); }} />
      <p className="field-hint">Hệ thống tự chốt lãi đến hết ngày liền trước, không tính trùng ngày.</p>
      <FieldError state={state} name="effectiveDate" />
    </div>
    <div className="field-group">
      <label htmlFor="restructurePrincipalPayment">Số gốc thực trả (VND)</label>
      <VndInput id="restructurePrincipalPayment" name="principalPaymentVnd" required placeholder="300.000.000" onValueChange={value => { setResult(null); setPrincipalPaymentVnd(value); }} />
      <FieldError state={state} name="principalPaymentVnd" />
    </div>

    {hasPrincipal && !validPrincipal ? <p className="field-error" role="alert">Số gốc thực trả phải lớn hơn 0.</p> : null}
    {validPrincipal && !result ? <p role="status">Đang tính phương án chính xác…</p> : null}
    {result?.error ? <p className="action-message" role="alert">{result.error}</p> : null}
    {(result?.error || (!state.ok && state.message)) && validPrincipal ? <button className="secondary-button" type="button" onClick={() => { reset(); setResult(null); setReload(value => value + 1); }}>Thử tính lại phương án</button> : null}

    {preview ? <fieldset key={`${effectiveDate}-${principalPaymentVnd}-${reload}`} className="settlement-preview restructure-preview">
      <legend>Phương án tại ngày {formatDate(preview.effectiveDate)}</legend>
      <div className="restructure-preview-section">
        <strong>Chốt nghĩa vụ cũ</strong>
        <dl>
          <div><dt>Dư gốc trước thay đổi</dt><dd>{formatVnd(preview.principalBeforeVnd)}</dd></div>
          <div><dt>Lãi đến hết {formatDate(preview.interestThroughDate)}</dt><dd>{formatVnd(preview.interestToSettleVnd)}</dd></div>
          <div><dt>Gốc thực trả</dt><dd>{formatVnd(preview.principalPaymentVnd)}</dd></div>
          <div className="restructure-cash-total"><dt>Tổng tiền thực trả</dt><dd>{formatVnd(totalCashVnd)}</dd></div>
        </dl>
      </div>
      <div className="restructure-preview-section">
        <strong>Mở kỳ mới</strong>
        <dl>
          <div><dt>Dư gốc mới</dt><dd>{formatVnd(preview.principalAfterVnd)}</dd></div>
          <div><dt>Chu kỳ mới</dt><dd>{formatDate(preview.newPeriodStartDate)}–{formatDate(preview.newPeriodEndDate)}</dd></div>
          <div><dt>Lãi dự kiến đủ {preview.newPeriodDayCount} ngày</dt><dd>{formatVnd(preview.newPeriodInterestVnd)}</dd></div>
        </dl>
      </div>
      <input type="hidden" name="expectedPrincipalBeforeVnd" value={preview.principalBeforeVnd} />
      <input type="hidden" name="expectedInterestVnd" value={preview.interestToSettleVnd} />
      <label className="confirmation-field"><input name="confirmation" type="checkbox" value="confirmed" required /><span>Tôi xác nhận gốc thực trả, lãi chốt đến ngày hôm trước và kỳ mới nêu trên.</span></label>
      <FieldError state={state} name="confirmation" />
    </fieldset> : null}

    <div className="field-group"><label htmlFor="restructureNote">Ghi chú</label><input id="restructureNote" name="note" maxLength={500} /><FieldError state={state} name="note" /></div>
    <ActionMessage state={state} />
    {preview ? <FormSubmit>Xác nhận giảm gốc</FormSubmit> : <button className="primary-button" type="button" disabled>Xác nhận giảm gốc</button>}
  </BusinessForm>;
}

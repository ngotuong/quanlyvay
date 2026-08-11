"use client";

import { useActionState } from "react";
import { onboardLegacyLoanAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { todayInVietnam } from "@/lib/business/format";
import { ActionMessage, FieldError, FormSubmit } from "./form-parts";
import { VndInput } from "./vnd-input";

export function LegacyOnboardingForm({ loanId, originalPrincipalVnd, idempotencyKey }: { loanId: string; originalPrincipalVnd: string; idempotencyKey: string }) {
  const [state, action] = useActionState(onboardLegacyLoanAction, initialBusinessActionState);
  return <form action={action} className="business-form correction-form">
    <input name="loanId" type="hidden" value={loanId} />
    <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
    <div className="correction-notice" role="note">Chỉ dùng một lần cho khoản cũ chưa có giao dịch. Hệ thống ghi số liệu tổng hợp vào nhật ký, không tạo giả từng kỳ thu lãi.</div>
    <div className="form-grid two-columns">
      <div className="field-group"><label htmlFor="legacyAsOfDate">Ngày chốt đối chiếu</label><input id="legacyAsOfDate" name="asOfDate" type="date" defaultValue={todayInVietnam()} required /><FieldError state={state} name="asOfDate" /></div>
      <div className="field-group"><label htmlFor="legacyPrincipal">Dư nợ gốc tại ngày chốt (VND)</label><VndInput id="legacyPrincipal" name="principalOutstandingVnd" defaultValue={originalPrincipalVnd} required /><FieldError state={state} name="principalOutstandingVnd" /></div>
      <div className="field-group"><label htmlFor="legacyInterest">Tổng lãi đã thu đến ngày chốt (VND)</label><VndInput id="legacyInterest" name="interestCollectedVnd" defaultValue="0" required /><FieldError state={state} name="interestCollectedVnd" /></div>
      <div className="field-group"><label htmlFor="legacyBadDebt">Ngày cuối cùng còn tính lãi (nếu là nợ xấu)</label><input id="legacyBadDebt" name="badDebtSince" type="date" aria-describedby="legacy-bad-debt-hint" /><p className="field-hint" id="legacy-bad-debt-hint">Ngày này vẫn tính lãi; ngừng phát sinh từ ngày kế tiếp. Kỳ cuối chưa đóng vẫn được giữ là lãi còn phải thu.</p><FieldError state={state} name="badDebtSince" /></div>
      <div className="field-group form-span-2"><label htmlFor="legacyNote">Ghi chú đối chiếu</label><textarea id="legacyNote" name="note" rows={3} maxLength={500} /></div>
      <label className="confirmation-field form-span-2"><input name="confirmation" type="checkbox" value="confirmed" required /><span>Tôi xác nhận đây là số dư tổng hợp từ sổ cũ.</span></label>
      <FieldError state={state} name="confirmation" />
    </div>
    <ActionMessage state={state} /><FormSubmit>Khởi tạo số dư khoản cũ</FormSubmit>
  </form>;
}

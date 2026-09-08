"use client";
import { useBusinessAction } from "./use-business-action";

import { Trash2 } from "lucide-react";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { ActionMessage, BusinessForm } from "./form-parts";
import { deleteCounterpartyAction } from "@/app/actions/business";

export function DeleteCounterpartyButton({ id, name }: { id: string; name: string }) {
  const [state, action, pending] = useBusinessAction(deleteCounterpartyAction, initialBusinessActionState);
  return (
    <BusinessForm state={state} action={action} onSubmit={(event) => { if (!window.confirm(`Xóa đối tác “${name}”? Chỉ đối tác chưa có khoản vay mới xóa được.`)) event.preventDefault(); }}>
      <input name="id" type="hidden" value={id} />
      <button className="icon-button danger-icon" disabled={pending} type="submit" aria-label={`Xóa ${name}`} title="Chỉ xóa được đối tác chưa có khoản vay"><Trash2 size={18} /></button>
      <ActionMessage state={state} />
    </BusinessForm>
  );
}

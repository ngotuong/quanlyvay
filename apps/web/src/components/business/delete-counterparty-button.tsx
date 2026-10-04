"use client";
import { useBusinessAction } from "./use-business-action";

import { useEffect, useRef } from "react";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { ActionMessage, BusinessForm } from "./form-parts";
import { deleteCounterpartyAction } from "@/app/actions/business";

export function DeleteCounterpartyButton({ id, name, menu = false }: { id: string; name: string; menu?: boolean }) {
  const [state, action, pending] = useBusinessAction(deleteCounterpartyAction, initialBusinessActionState);
  const details = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (event.target instanceof Node && !details.current?.contains(event.target)) details.current?.removeAttribute("open"); };
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, []);
  const form = (
    <BusinessForm state={state} action={action} onSubmit={(event) => { if (!window.confirm(`Xóa đối tác “${name}”? Chỉ đối tác chưa có khoản vay mới xóa được.`)) event.preventDefault(); }}>
      <input name="id" type="hidden" value={id} />
      <button className={menu ? "secondary-button counterparty-menu-delete" : "icon-button danger-icon"} disabled={pending} type="submit" aria-label={`Xóa ${name}`} title="Chỉ xóa được đối tác chưa có khoản vay"><Trash2 size={18} />{menu ? "Xóa đối tác" : null}</button>
      <ActionMessage state={state} />
    </BusinessForm>
  );
  if (!menu) return form;
  return <details ref={details} className="counterparty-menu" onKeyDown={event => {
    if (event.key === "Escape" && details.current?.open) { event.preventDefault(); details.current.removeAttribute("open"); details.current.querySelector("summary")?.focus(); }
  }}><summary aria-label={`Thao tác khác với ${name}`} title="Thao tác khác"><MoreHorizontal size={20} aria-hidden="true" /></summary><div className="counterparty-menu-panel">{form}</div></details>;
}

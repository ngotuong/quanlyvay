"use client";

import { Trash2 } from "lucide-react";
import { deleteCounterpartyAction } from "@/app/actions/business";

export function DeleteCounterpartyButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteCounterpartyAction} onSubmit={(event) => { if (!window.confirm(`Xóa đối tác “${name}”? Chỉ đối tác chưa có khoản vay mới xóa được.`)) event.preventDefault(); }}>
      <input name="id" type="hidden" value={id} />
      <button className="icon-button danger-icon" type="submit" aria-label={`Xóa ${name}`} title="Chỉ xóa được đối tác chưa có khoản vay"><Trash2 size={18} /></button>
    </form>
  );
}

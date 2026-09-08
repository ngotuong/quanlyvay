"use client";
import { useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { saveCounterpartyAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { ActionMessage, FieldError } from "./form-parts";
import type { Counterparty } from "@/lib/business/types";

export function CounterpartyPicker({ items, id, defaultValue = "" }: { items: Counterparty[]; id: string; defaultValue?: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(defaultValue);
  const [created, setCreated] = useState<Array<{ id: string; name: string }>>([]);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState(initialBusinessActionState);
  const nameInput = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dirty = useRef(false);
  const combined = [...items, ...created.filter(row => !items.some(item => item.id === row.id))];
  const matches = combined.filter(row => row.name.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))).slice(0, 50);
  const current = combined.find(row => row.id === selected);
  if (current && !matches.some(row => row.id === selected)) matches.unshift(current);
  function close(saved = false) {
    if (!saved && (pending || (dirty.current && !window.confirm("Bỏ thông tin đối tác chưa lưu?")))) return;
    dirty.current = false; dialog.current?.close(); setOpen(false); trigger.current?.focus();
  }
  return <>
    <label htmlFor={`${id}-search`}>Tìm đối tác</label><input id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Nhập tên để tìm trong danh sách" />
    <select id={id} name="counterpartyId" required value={selected} onChange={event => setSelected(event.target.value)}><option value="">Chọn đối tác</option>{matches.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
    <button ref={trigger} className="secondary-button" type="button" onClick={() => { setState(initialBusinessActionState); setOpen(true); }}>Thêm đối tác mới</button>
    {open ? createPortal(<dialog className="transaction-dialog" aria-labelledby={`${id}-title`} ref={node => { dialog.current = node; if (node && !node.open) node.showModal(); }} onCancel={event => { event.preventDefault(); close(); }}>
      <div className="dialog-heading"><h2 id={`${id}-title`}>Thêm đối tác mới</h2><button type="button" disabled={pending} className="icon-button" aria-label="Đóng" onClick={() => close()}>×</button></div>
      <form className="compact-form dialog-form" onChange={() => { dirty.current = true; }} onSubmit={event => {
        event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get("name") ?? "").trim();
        startTransition(async () => {
          try {
            const result = await saveCounterpartyAction(initialBusinessActionState, form);
            if (!result.ok || !result.createdId) { setState(result); if (result.fieldErrors?.name) nameInput.current?.focus(); return; }
            setCreated(rows => [...rows, { id: result.createdId!, name }]); setSelected(result.createdId); setQuery(""); close(true);
          } catch { setState({ok:false,message:"Chưa thể thêm đối tác. Kiểm tra kết nối và thử lại."}); }
        });
      }}><div className="field-group"><label htmlFor={`${id}-new-name`}>Tên đối tác mới</label><input ref={nameInput} id={`${id}-new-name`} name="name" required maxLength={120} /><FieldError state={state} name="name" /></div><input name="notes" type="hidden" value="" />
        <ActionMessage state={state} /><div className="dialog-actions"><button className="secondary-button" type="button" disabled={pending} onClick={() => close()}>Hủy</button><button className="primary-button" disabled={pending}>{pending ? "Đang thêm…" : "Thêm và chọn"}</button></div>
      </form>
    </dialog>, document.body) : null}
  </>;
}

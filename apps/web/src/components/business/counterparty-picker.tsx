"use client";

import { useEffect, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, Search } from "lucide-react";
import { saveCounterpartyAction } from "@/app/actions/business";
import { initialBusinessActionState } from "@/lib/business/action-state";
import { ActionMessage, FieldError } from "./form-parts";
import type { Counterparty } from "@/lib/business/types";

export function CounterpartyPicker({ items, id, defaultValue = "" }: { items: Counterparty[]; id: string; defaultValue?: string }) {
  const initialName = items.find(row => row.id === defaultValue)?.name ?? "";
  const [query, setQuery] = useState(initialName);
  const [selected, setSelected] = useState(defaultValue);
  const [created, setCreated] = useState<Array<{ id: string; name: string }>>([]);
  const [listOpen, setListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [state, setState] = useState(initialBusinessActionState);
  const nameInput = useRef<HTMLInputElement>(null);
  const optionsList = useRef<HTMLDivElement>(null);
  const combobox = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dirty = useRef(false);
  const combined = [...items, ...created.filter(row => !items.some(item => item.id === row.id))];
  const current = combined.find(row => row.id === selected);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const searchTerm = current?.name === query ? "" : normalizedQuery;
  const matches = combined.filter(row => row.name.toLocaleLowerCase("vi").includes(searchTerm)).slice(0, 50);
  const listboxId = `${id}-options`;

  useEffect(() => {
    combobox.current?.setCustomValidity(selected ? "" : "Hãy chọn một đối tác trong danh sách.");
  }, [selected]);

  useEffect(() => {
    if (!listOpen) return;
    optionsList.current?.querySelector<HTMLElement>(`[role="option"][aria-selected="false"].is-active`)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, listOpen]);

  function select(row: { id: string; name: string }) {
    setSelected(row.id);
    setQuery(row.name);
    setListOpen(false);
    setActiveIndex(0);
  }

  function changeQuery(value: string) {
    const normalized = value.trim().toLocaleLowerCase("vi");
    const exact = combined.filter(row => row.name.toLocaleLowerCase("vi") === normalized);
    setQuery(value);
    setSelected(exact.length === 1 ? exact[0].id : "");
    setListOpen(true);
    setActiveIndex(0);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { setListOpen(false); return; }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setListOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex(index => matches.length ? (index + direction + matches.length) % matches.length : 0);
      return;
    }
    if (event.key === "Enter" && listOpen && matches.length) {
      event.preventDefault();
      select(matches[Math.min(activeIndex, matches.length - 1)]);
    }
  }

  function closeDialog(saved = false) {
    if (!saved && (pending || (dirty.current && !window.confirm("Bỏ thông tin đối tác chưa lưu?")))) return;
    dirty.current = false;
    dialog.current?.close();
    setDialogOpen(false);
    trigger.current?.focus();
  }

  return <>
    <div className="counterparty-combobox" onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setListOpen(false);
    }}>
      <div className="counterparty-combobox-input">
        <Search aria-hidden="true" size={18} />
        <input
          ref={combobox}
          id={id}
          type="search"
          role="combobox"
          required
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={listOpen}
          aria-activedescendant={listOpen && matches[activeIndex] ? `${id}-option-${matches[activeIndex].id}` : undefined}
          data-field-name="counterpartyId"
          value={query}
          onChange={event => changeQuery(event.target.value)}
          onFocus={() => { setListOpen(true); setActiveIndex(Math.max(0, matches.findIndex(row => row.id === selected))); }}
          onKeyDown={handleKeyDown}
          onInvalid={event => {
            if (!selected) event.currentTarget.setCustomValidity("Hãy chọn một đối tác trong danh sách.");
          }}
          placeholder="Chọn hoặc nhập tên đối tác"
        />
      </div>
      <input name="counterpartyId" type="hidden" value={selected} />
      {listOpen ? <div ref={optionsList} className="counterparty-options" id={listboxId} role="listbox" aria-label="Danh sách đối tác">
        {matches.length ? matches.map((row, index) => <button
          id={`${id}-option-${row.id}`}
          key={row.id}
          type="button"
          role="option"
          aria-selected={row.id === selected}
          className={index === activeIndex ? "is-active" : undefined}
          onMouseDown={event => event.preventDefault()}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => select(row)}
        ><span>{row.name}</span>{row.id === selected ? <Check aria-hidden="true" size={18} /> : null}</button>) : <p className="counterparty-empty">Không tìm thấy đối tác phù hợp.</p>}
      </div> : null}
    </div>
    <button ref={trigger} className="secondary-button" type="button" onClick={() => { setState(initialBusinessActionState); setDialogOpen(true); }}>Thêm đối tác mới</button>
    {dialogOpen ? createPortal(<dialog className="transaction-dialog" aria-labelledby={`${id}-title`} ref={node => { dialog.current = node; if (node && !node.open) node.showModal(); }} onCancel={event => { event.preventDefault(); closeDialog(); }}>
      <div className="dialog-heading"><h2 id={`${id}-title`}>Thêm đối tác mới</h2><button type="button" disabled={pending} className="icon-button" aria-label="Đóng" onClick={() => closeDialog()}>×</button></div>
      <form className="compact-form dialog-form" onChange={() => { dirty.current = true; }} onSubmit={event => {
        event.preventDefault(); const form = new FormData(event.currentTarget); const name = String(form.get("name") ?? "").trim();
        startTransition(async () => {
          try {
            const result = await saveCounterpartyAction(initialBusinessActionState, form);
            if (!result.ok || !result.createdId) { setState(result); if (result.fieldErrors?.name) nameInput.current?.focus(); return; }
            setCreated(rows => [...rows, { id: result.createdId!, name }]); select({ id: result.createdId, name }); closeDialog(true);
          } catch { setState({ok:false,message:"Chưa thể thêm đối tác. Kiểm tra kết nối và thử lại."}); }
        });
      }}><div className="field-group"><label htmlFor={`${id}-new-name`}>Tên đối tác mới</label><input ref={nameInput} id={`${id}-new-name`} name="name" required maxLength={120} /><FieldError state={state} name="name" /></div><input name="notes" type="hidden" value="" />
        <ActionMessage state={state} /><div className="dialog-actions"><button className="secondary-button" type="button" disabled={pending} onClick={() => closeDialog()}>Hủy</button><button className="primary-button" disabled={pending}>{pending ? "Đang thêm…" : "Thêm và chọn"}</button></div>
      </form>
    </dialog>, document.body) : null}
  </>;
}

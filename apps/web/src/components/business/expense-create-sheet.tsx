"use client";

import { useRef, useState } from "react";
import { PrivacyCreateGuard } from "@/components/app/privacy-create-guard";
import { PrivacyForm } from "@/components/app/privacy-provider";
import { BottomSheet, notifyToast } from "@/components/ui";
import { GeneralExpenseForm } from "./general-expense-form";

export function ExpenseCreateSheet({ idempotencyKey }: { idempotencyKey: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [dirty, setDirty] = useState(false);
  const [pending, setPending] = useState(false);
  const [session, setSession] = useState(0);

  function close(force = false) {
    if (pending && !force) return;
    if (!force && dirty && !window.confirm("Bạn có thay đổi chưa lưu. Đóng và bỏ các thay đổi này?")) return;
    dialog.current?.close();
    setDirty(false);
    setSession(value => value + 1);
    trigger.current?.focus();
  }

  return <>
    <PrivacyCreateGuard triggerRef={trigger} className="expense-create-trigger" label="Thêm chi phí" onOpen={() => dialog.current?.showModal()} />
    <BottomSheet ref={dialog} title="Thêm chi phí" eyebrow="Chi phí chung" onRequestClose={() => close()} closeDisabled={pending}>
      <PrivacyForm><GeneralExpenseForm idempotencyKey={idempotencyKey} key={session} onDirtyChange={setDirty} onPendingChange={setPending} onSuccess={message => {
        close(true);
        notifyToast(message, "success");
      }} /></PrivacyForm>
    </BottomSheet>
  </>;
}

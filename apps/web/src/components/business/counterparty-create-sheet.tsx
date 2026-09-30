"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { PrivacyForm } from "@/components/app/privacy-provider";
import { BottomSheet, Button, notifyToast } from "@/components/ui";
import { CounterpartyForm } from "./counterparty-form";

export function CounterpartyCreateSheet() {
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
    <Button ref={trigger} className="counterparty-create-trigger" onClick={() => dialog.current?.showModal()}><Plus size={18} /> Thêm đối tác</Button>
    <BottomSheet ref={dialog} title="Thêm đối tác" eyebrow="Hồ sơ liên hệ" onRequestClose={() => close()} closeDisabled={pending}>
      <PrivacyForm><CounterpartyForm key={session} onDirtyChange={setDirty} onPendingChange={setPending} onSuccess={message => {
        close(true);
        notifyToast(message, "success");
      }} /></PrivacyForm>
    </BottomSheet>
  </>;
}

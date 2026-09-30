"use client";

import { useRef, useState } from "react";
import { PrivacyForm } from "@/components/app/privacy-provider";
import { notifyToast } from "@/components/ui";
import type { Counterparty } from "@/lib/business/types";
import { CounterpartyForm } from "./counterparty-form";

export function CounterpartyEditor({ counterparty }: { counterparty: Counterparty }) {
  const details = useRef<HTMLDetailsElement>(null);
  const [session, setSession] = useState(0);

  return <details ref={details} className="edit-details"><summary>Chỉnh sửa thông tin</summary><PrivacyForm><CounterpartyForm key={session} counterparty={counterparty} onSuccess={message => {
    details.current?.removeAttribute("open");
    setSession(value => value + 1);
    notifyToast(message, "success");
    details.current?.querySelector("summary")?.focus();
  }} /></PrivacyForm></details>;
}

import { PrivacyForm } from "@/components/app/privacy-provider";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoanForm } from "@/components/business/loan-form";
import { requireWriterProfile } from "@/lib/auth/session";
import { listCounterparties } from "@/lib/business/queries";

export default async function NewLoanPage() {
  await requireWriterProfile();
  const counterparties = await listCounterparties();
  return (
    <>
      <Link className="back-link" href="/loans"><ArrowLeft size={18} />Quay lại danh sách</Link>
      <div className="page-heading-row"><div className="mobile-repeated-title"><h1>Tạo khoản vay</h1></div></div>
      <section className="surface-card form-surface"><PrivacyForm><LoanForm counterparties={counterparties} idempotencyKey={randomUUID()} /></PrivacyForm></section>
    </>
  );
}

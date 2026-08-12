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
      {counterparties.length === 0 ? <section className="empty-state"><h2>Cần có đối tác trước</h2><p>Thêm người vay hoặc người cho vay rồi quay lại bước này.</p><Link className="primary-link" href="/counterparties">Đi tới đối tác</Link></section> : <section className="surface-card form-surface"><LoanForm counterparties={counterparties} idempotencyKey={randomUUID()} /></section>}
    </>
  );
}

import { randomUUID } from "node:crypto";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { LoanForm } from "@/components/business/loan-form";
import { requireWriterProfile } from "@/lib/auth/session";
import { listCounterparties } from "@/lib/business/queries";

export default async function NewLoanPage() {
  const profile = await requireWriterProfile();
  const counterparties = await listCounterparties();
  return (
    <AppShell profile={profile}>
      <Link className="back-link" href="/"><ArrowLeft size={18} />Quay lại danh sách</Link>
      <div className="page-heading-row"><div><p className="eyebrow">Khoản vay mới</p><h1>Tạo khoản vay</h1><p className="page-description">Thông tin tài chính gốc sẽ được khóa; các thay đổi sau đó được ghi thành lịch sử.</p></div></div>
      {counterparties.length === 0 ? <section className="empty-state"><h2>Cần có đối tác trước</h2><p>Thêm người vay hoặc người cho vay rồi quay lại bước này.</p><Link className="primary-link" href="/counterparties">Đi tới đối tác</Link></section> : <section className="surface-card form-surface"><LoanForm counterparties={counterparties} idempotencyKey={randomUUID()} /></section>}
    </AppShell>
  );
}

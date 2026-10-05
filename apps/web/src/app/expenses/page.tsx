import { ExpenseDistribution } from "@/components/business/expense-distribution";
import { redirect } from "next/navigation";
import { clampPage, pageHref } from "@/lib/business/list-page.mjs";
import { RenderRevision } from "@/components/app/render-revision";
import { Pagination, parsePage } from "@/components/business/pagination";
import { randomUUID } from "node:crypto";
import { ReceiptText, WalletCards } from "lucide-react";
import { ExpenseCreateSheet } from "@/components/business/expense-create-sheet";
import { ReversalForm } from "@/components/business/reversal-form";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate, formatVnd } from "@/lib/business/format";
import { listGeneralExpenses } from "@/lib/business/queries";

import { PrivacyAmount, PrivacyRegion, PrivacyForm } from "@/components/app/privacy-provider";
import { Card } from "@/components/ui";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ page?: string; unread?: string }> }) {
  const profile = await requireAuthenticatedProfile();
  const params = await searchParams;
  const page = parsePage(params.page);
  const result = await listGeneralExpenses(page);
  const canonicalPage = clampPage(page, result.totalCount);
  if (page !== canonicalPage) redirect(pageHref("/expenses", canonicalPage));
  const expenses = result.items;
  const canWrite = profile.role !== "VIEWER";
  const expenseRows = expenses;
  const totalExpenseVnd = BigInt(result.totalVnd);

  return (
    <>
      <RenderRevision />
      <div className="page-heading-row">
        <div className="page-title-lockup"><span className="page-title-icon"><WalletCards size={24} strokeWidth={1.8} /></span><div><h1>Chi phí chung</h1></div></div>
        {canWrite ? <ExpenseCreateSheet idempotencyKey={randomUUID()} /> : null}
      </div>

      <Pagination page={page} total={result.totalCount} href="/expenses" label="Phân trang đầu danh sách chi phí" className="expense-pagination-top" hideSinglePage />
      {result.categories.length > 0 ? <ExpenseDistribution total={totalExpenseVnd.toString()} categories={result.categories} /> : null}

      <div>
        <section className="counterparty-list compact-record-list expense-record-list" aria-label="Danh sách chi phí chung">
          {expenseRows.length === 0 ? <div className="empty-state compact"><ReceiptText size={26} /><h2>Chưa có chi phí chung</h2><p>Các chi phí không gắn khoản vay sẽ xuất hiện tại đây.</p></div> : expenseRows.map((expense) => (
            <Card as="article" variant="interactive" className="surface-card counterparty-card expense-card" key={expense.id}>
              <div className="counterparty-card-heading"><div><h2><PrivacyRegion>{expense.expenses?.category ?? "Chi phí khác"}</PrivacyRegion></h2><p>{formatDate(expense.transaction_date)}</p></div><strong className="privacy-amount"><PrivacyAmount value={formatVnd(expense.amount_vnd)} /></strong></div>
              <p className="notes-copy"><PrivacyRegion>{expense.note || "Không có ghi chú."}</PrivacyRegion></p>
              {expense.reversed ? <p className="action-message" data-success="true">Đã đảo giao dịch</p> : canWrite ? <PrivacyForm><ReversalForm loanId={null} transactionId={expense.id} idempotencyKey={randomUUID()} /></PrivacyForm> : null}
            </Card>
          ))}
        </section>
      </div>
      <Pagination page={page} total={result.totalCount} href="/expenses" />
    </>
  );
}

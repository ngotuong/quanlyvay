import { RenderRevision } from "@/components/app/render-revision";
import { Pagination, parsePage } from "@/components/business/pagination";
import { randomUUID } from "node:crypto";
import { ReceiptText, WalletCards } from "lucide-react";
import { GeneralExpenseForm } from "@/components/business/general-expense-form";
import { ReversalForm } from "@/components/business/reversal-form";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate, formatVnd } from "@/lib/business/format";
import { listGeneralExpenses } from "@/lib/business/queries";

import { PrivacyAmount, PrivacyRegion, PrivacyForm } from "@/components/app/privacy-provider";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ page?: string; unread?: string }> }) {
  const profile = await requireAuthenticatedProfile();
  const params = await searchParams;
  const page = parsePage(params.page);
  const result = await listGeneralExpenses(page);
  const expenses = result.items;
  const canWrite = profile.role !== "VIEWER";
  const expenseRows = expenses;
  const totalExpenseVnd = BigInt(result.totalVnd);
  const categoryEntries = result.categories.map(item => [item.category, BigInt(item.amountVnd)] as const);

  return (
    <>
      <RenderRevision />
      <div className="page-heading-row">
        <div className="page-title-lockup"><span className="page-title-icon"><WalletCards size={24} strokeWidth={1.8} /></span><div><h1>Chi phí chung</h1></div></div>
      </div>

      {result.categories.length > 0 ? (
        <section className="surface-card mb-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 mb-3 gap-2">
            <div>
              <p className="eyebrow">Tổng quan ngân sách</p>
              <h2 className="text-lg font-bold">Phân bổ danh mục chi phí</h2>
            </div>
            <div className="text-right">
              <small className="text-muted block">Tổng chi phí</small>
              <strong className="text-xl font-bold text-indigo-600"><PrivacyAmount value={formatVnd(totalExpenseVnd.toString())} /></strong>
            </div>
          </div>

          <div className="space-y-2">
            {categoryEntries.map(([catName, amount]) => {
              const percentage = totalExpenseVnd === BigInt(0) ? 0 : Math.round(Number((amount * BigInt(100)) / totalExpenseVnd));
              return (
                <div key={catName} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium"><PrivacyRegion>{catName}</PrivacyRegion></span>
                    <span>
                      <strong className="privacy-amount"><PrivacyAmount value={formatVnd(amount.toString())} /></strong> <small className="text-muted">({percentage}%)</small>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <div className={canWrite ? "two-panel-layout" : undefined}>
        {canWrite ? <section className="surface-card sticky-panel"><h2>Thêm chi phí</h2><PrivacyForm><GeneralExpenseForm idempotencyKey={randomUUID()} /></PrivacyForm></section> : null}
        <section className="counterparty-list" aria-label="Danh sách chi phí chung">
          {expenseRows.length === 0 ? <div className="empty-state compact"><ReceiptText size={26} /><h2>Chưa có chi phí chung</h2><p>Các chi phí không gắn khoản vay sẽ xuất hiện tại đây.</p></div> : expenseRows.map((expense) => (
            <article className="surface-card counterparty-card" key={expense.id}>
              <div className="counterparty-card-heading"><div><h2><PrivacyRegion>{expense.expenses?.category ?? "Chi phí khác"}</PrivacyRegion></h2><p>{formatDate(expense.transaction_date)}</p></div><strong className="privacy-amount"><PrivacyAmount value={formatVnd(expense.amount_vnd)} /></strong></div>
              <p className="notes-copy"><PrivacyRegion>{expense.note || "Không có ghi chú."}</PrivacyRegion></p>
              {expense.reversed ? <p className="action-message" data-success="true">Đã đảo giao dịch</p> : canWrite ? <PrivacyForm><ReversalForm loanId={null} transactionId={expense.id} idempotencyKey={randomUUID()} /></PrivacyForm> : null}
            </article>
          ))}
        </section>
      </div>
      <Pagination page={page} total={result.totalCount} href="/expenses" />
    </>
  );
}

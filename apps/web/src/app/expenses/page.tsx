import { randomUUID } from "node:crypto";
import { ReceiptText } from "lucide-react";
import { AppShell } from "@/components/app/app-shell";
import { GeneralExpenseForm } from "@/components/business/general-expense-form";
import { ReversalForm } from "@/components/business/reversal-form";
import { requireAuthenticatedProfile } from "@/lib/auth/session";
import { formatDate, formatVnd } from "@/lib/business/format";
import { getUnreadNotificationCount, listGeneralExpenses } from "@/lib/business/queries";

export default async function ExpensesPage() {
  const profile = await requireAuthenticatedProfile();
  const [expenses, unreadCount] = await Promise.all([
    listGeneralExpenses(),
    getUnreadNotificationCount(),
  ]);
  const canWrite = profile.role !== "VIEWER";
  const reversedIds = new Set(expenses.filter((item) => item.type === "REVERSAL").map((item) => item.reversal_of_id));
  const expenseRows = expenses.filter((item) => item.type === "EXPENSE");

  return (
    <AppShell profile={profile} unreadCount={unreadCount}>
      <div className="page-heading-row">
        <div><p className="eyebrow">Dòng tiền vận hành</p><h1>Chi phí chung</h1><p className="page-description">Các khoản chi không gắn riêng với một khoản vay.</p></div>
      </div>
      <div className={canWrite ? "two-panel-layout" : undefined}>
        {canWrite ? <section className="surface-card sticky-panel"><h2>Thêm chi phí</h2><GeneralExpenseForm idempotencyKey={randomUUID()} /></section> : null}
        <section className="counterparty-list" aria-label="Danh sách chi phí chung">
          {expenseRows.length === 0 ? <div className="empty-state compact"><ReceiptText size={26} /><h2>Chưa có chi phí chung</h2><p>Các chi phí không gắn khoản vay sẽ xuất hiện tại đây.</p></div> : expenseRows.map((expense) => (
            <article className="surface-card counterparty-card" key={expense.id}>
              <div className="counterparty-card-heading"><div><h2>{expense.expenses?.category ?? "Chi phí khác"}</h2><p>{formatDate(expense.transaction_date)}</p></div><strong>{formatVnd(expense.amount_vnd)}</strong></div>
              <p className="notes-copy">{expense.note || "Không có ghi chú."}</p>
              {reversedIds.has(expense.id) ? <p className="action-message" data-success="true">Đã đảo giao dịch</p> : canWrite ? <ReversalForm loanId={null} transactionId={expense.id} idempotencyKey={randomUUID()} /> : null}
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

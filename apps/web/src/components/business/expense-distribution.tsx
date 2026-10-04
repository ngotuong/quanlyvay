"use client";

import { PrivacyAmount, usePrivacy } from "@/components/app/privacy-provider";
import { expensePercentage } from "@/lib/business/percentage.mjs";
import { formatVnd } from "@/lib/business/format";

export function ExpenseDistribution({ total, categories }: { total: string; categories: Array<{ category: string; amountVnd: string }> }) {
  const { isPrivacyMode } = usePrivacy();
  return <section className="surface-card expense-distribution" aria-labelledby="expense-budget-title">
    <div className="expense-budget-heading"><div><p className="eyebrow">Tổng quan ngân sách</p><h2 id="expense-budget-title">Tổng chi phí</h2></div>
      <strong className="expense-budget-total"><PrivacyAmount value={formatVnd(total)} /></strong>
    </div>
    {isPrivacyMode ? <p className="chart-privacy-notice" role="status">Phân bổ chi phí đang ẩn. Bấm “Hiển thị số tiền” để xem.</p> :
      <details className="expense-category-details"><summary>Phân bổ danh mục chi phí</summary><div className="expense-category-list">
        {categories.map(item => {
          const percentage = expensePercentage(item.amountVnd, total);
          return <div className="expense-category" key={item.category}>
            <div className="expense-category-heading"><span>{item.category}</span><span className="expense-category-value"><strong>{formatVnd(item.amountVnd)}</strong> <small>({percentage.replace(".", ",")}%)</small></span></div>
            <div className="expense-category-track" aria-hidden="true"><div style={{ width: `${percentage}%` }} /></div>
          </div>;
        })}
      </div></details>}
  </section>;
}

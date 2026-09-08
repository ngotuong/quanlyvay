/**
 * Reconstructs the C20 expense page envelope from legacy, RLS-protected rows.
 * VND values stay as bigint throughout aggregation to retain exactness.
 *
 * @param {Array<Record<string, any>>} rows
 * @param {number} page
 * @param {number} size
 */
export function buildLegacyGeneralExpensesPage(rows, page, size) {
  const reversedIds = new Set(rows
    .filter((row) => row.type === "REVERSAL" && row.reversal_of_id)
    .map((row) => row.reversal_of_id));
  const expenses = rows
    .filter((row) => row.type === "EXPENSE")
    .map((row) => ({ ...row, reversed: reversedIds.has(row.id) }));
  const effective = expenses.filter((row) => !row.reversed);
  const categoryTotals = new Map();
  let totalVnd = 0n;

  for (const row of effective) {
    const amount = BigInt(row.amount_vnd);
    const category = row.expenses?.category ?? "Chi phí khác";
    totalVnd += amount;
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0n) + amount);
  }

  const offset = (page - 1) * size;
  return {
    items: expenses.slice(offset, offset + size),
    totalCount: expenses.length,
    totalVnd: totalVnd.toString(),
    categories: [...categoryTotals]
      .sort(([leftName, leftAmount], [rightName, rightAmount]) => {
        if (leftAmount !== rightAmount) return leftAmount > rightAmount ? -1 : 1;
        return String(leftName).localeCompare(String(rightName), "vi");
      })
      .map(([category, amountVnd]) => ({ category, amountVnd: amountVnd.toString() })),
  };
}

/** Presentation only: nearest 0.01 percentage point, using integer arithmetic. */
export function expensePercentage(amount, total) {
  const value = BigInt(amount);
  const sum = BigInt(total);
  if (sum <= 0n || value <= 0n) return "0";
  const scaled = (value * 10000n + sum / 2n) / sum;
  const whole = scaled / 100n;
  const fraction = (scaled % 100n).toString().padStart(2, "0").replace(/0+$/, "");
  return `${whole}${fraction ? `.${fraction}` : ""}`;
}

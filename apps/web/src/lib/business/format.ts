export function formatVnd(value: number | string | null | undefined) {
  const amount: number | bigint = typeof value === "string"
    ? (/^-?\d+$/.test(value) ? BigInt(value) : 0)
    : (value ?? 0);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00+07:00`),
  );
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function todayInVietnam() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatRate(value: number | string | null) {
  if (value === null) return "—";
  const normalized = String(value)
    .replace(/(\.\d*?[1-9])0+$/, "$1")
    .replace(/\.0+$/, "")
    .replace(".", ",");
  return `${normalized}%/ngày`;
}

export function multiplyDecimal(value: number | string, multiplier: number) {
  const normalized = String(value).replace(",", ".");
  const match = normalized.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) return "0";
  const [, sign, whole, fraction = ""] = match;
  const scale = BigInt(10) ** BigInt(fraction.length);
  const scaled = BigInt(`${whole}${fraction}`) * BigInt(multiplier) * (sign === "-" ? BigInt(-1) : BigInt(1));
  const absolute = scaled < BigInt(0) ? -scaled : scaled;
  const integerPart = absolute / scale;
  const fractionPart = fraction.length === 0
    ? ""
    : (absolute % scale).toString().padStart(fraction.length, "0").replace(/0+$/, "");
  return `${scaled < BigInt(0) ? "-" : ""}${integerPart}${fractionPart ? `.${fractionPart}` : ""}`;
}

export function periodRateInput(dailyRate: number | string, cycleDays: number) {
  const multiplied = multiplyDecimal(dailyRate, cycleDays);
  const match = multiplied.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) return "0";
  const [, sign, whole, fraction = ""] = match;
  if (fraction.length <= 6) return multiplied;
  const kept = fraction.slice(0, 6);
  const scale = BigInt(1_000_000);
  let rounded = BigInt(whole) * scale + BigInt(kept);
  if (Number(fraction[6]) >= 5) rounded += BigInt(1);
  const roundedWhole = rounded / scale;
  const roundedFraction = (rounded % scale).toString().padStart(6, "0").replace(/0+$/, "");
  return `${sign}${roundedWhole}${roundedFraction ? `.${roundedFraction}` : ""}`;
}

export function formatPeriodRate(dailyRate: number | string | null, cycleDays: number) {
  if (dailyRate === null) return "—";
  return `${periodRateInput(dailyRate, cycleDays).replace(".", ",")}%/${cycleDays} ngày`;
}

export function formatPercent(value: number | string | null) {
  if (value === null) return "—";
  return `${String(value).replace(/(\.\d*?[1-9])0+$/, "$1").replace(/\.0+$/, "").replace(".", ",")}%`;
}

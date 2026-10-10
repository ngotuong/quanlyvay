import { formatVndDigits, normalizeVnd } from "./vnd.mjs";

export const MAX_QUICK_VND = "9223372036854775807";
export const PRINCIPAL_QUICK_AMOUNTS = Object.freeze([
  { amount: "50000000", label: "+50tr", accessibleLabel: "Cộng 50 triệu đồng" },
  { amount: "100000000", label: "+100tr", accessibleLabel: "Cộng 100 triệu đồng" },
  { amount: "150000000", label: "+150tr", accessibleLabel: "Cộng 150 triệu đồng" },
  { amount: "200000000", label: "+200tr", accessibleLabel: "Cộng 200 triệu đồng" },
]);

/**
 * Input convenience only. Server/RPC remains authoritative for the ledger and date.
 * @param {string} current
 * @param {string} increment
 * @param {string | undefined} maximumVnd
 * @returns {{ok: true, normalizedValue: string, formattedValue: string} | {ok: false, error: string}}
 */
export function addQuickVnd(current, increment, maximumVnd) {
  const value = current.trim() === "" ? "0" : normalizeVnd(current);
  const delta = normalizeVnd(increment);
  if (!/^\d+$/.test(value) || !/^\d+$/.test(delta) || /^0+$/.test(delta)) {
    return { ok: false, error: "Hãy nhập số nguyên VND hợp lệ trước khi cộng thêm." };
  }
  const limit = maximumVnd === undefined ? MAX_QUICK_VND : normalizeVnd(maximumVnd);
  if (!/^\d+$/.test(limit)) return { ok: false, error: "Chưa có giới hạn nhập nhanh hợp lệ. Hãy tải lại khoản vay." };
  const systemLimit = BigInt(MAX_QUICK_VND);
  const contextLimit = limit.length > MAX_QUICK_VND.length ? systemLimit : BigInt(limit);
  const maximum = contextLimit < systemLimit ? contextLimit : systemLimit;
  if (value.length > MAX_QUICK_VND.length || delta.length > MAX_QUICK_VND.length) {
    return { ok: false, error: "Số tiền vượt giới hạn lưu trữ VND. Giá trị hiện tại được giữ nguyên." };
  }
  const total = BigInt(value) + BigInt(delta);
  if (total > maximum) {
    return { ok: false, error: `Không thể cộng thêm: giới hạn nhập nhanh là ${formatVndDigits(maximum.toString())} ₫. Giá trị hiện tại được giữ nguyên.` };
  }
  const normalizedValue = total.toString();
  return { ok: true, normalizedValue, formattedValue: formatVndDigits(normalizedValue) };
}

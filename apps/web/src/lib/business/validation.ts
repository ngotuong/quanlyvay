import { z } from "zod";
import { normalizeVnd } from "./vnd.mjs";

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} là bắt buộc.`).max(max, `${label} quá dài.`);

const optionalText = z
  .string()
  .trim()
  .max(500, "Ghi chú tối đa 500 ký tự.")
  .transform((value) => value || null);

const uuid = z.uuid("Mã dữ liệu không hợp lệ.");
const businessDate = z.iso.date("Ngày không hợp lệ.");
const MAX_BIGINT_VND = BigInt("9223372036854775807");

function percentageWithinLimit(value: string) {
  if (!/^\d+(\.\d{1,10})?$/.test(value)) return false;
  const [whole, fraction = ""] = value.split(".");
  const integer = BigInt(whole);
  return integer < BigInt(100) || (integer === BigInt(100) && !/[1-9]/.test(fraction));
}

const vndAmount = z
  .string()
  .trim()
  .transform(normalizeVnd)
  .refine((value) => /^\d+$/.test(value), "Số tiền phải là số nguyên VND.")
  .refine((value) => /^\d+$/.test(value) && BigInt(value) > BigInt(0), "Số tiền phải lớn hơn 0.")
  .refine((value) => /^\d+$/.test(value) && BigInt(value) <= MAX_BIGINT_VND, "Số tiền vượt giới hạn lưu trữ VND.");

const vndNonnegative = z
  .string()
  .trim()
  .transform(normalizeVnd)
  .refine((value) => /^\d+$/.test(value), "Số tiền phải là số nguyên VND.")
  .refine((value) => /^\d+$/.test(value) && BigInt(value) <= MAX_BIGINT_VND, "Số tiền vượt giới hạn lưu trữ VND.");

const periodRate = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .refine((value) => /^\d+(\.\d{1,10})?$/.test(value), "Lãi suất không hợp lệ.")
  .refine(percentageWithinLimit, "Lãi suất phải từ 0 đến 100%/kỳ.");

const optionalLoanName = z
  .string()
  .trim()
  .max(120, "Nhãn phân biệt tối đa 120 ký tự.")
  .transform((value) => value || null);

const optionalTermDays = z
  .union([z.literal(""), z.coerce.number().int().min(1, "Số ngày vay phải lớn hơn 0.").max(36500)])
  .transform((value) => value === "" ? null : value);

const maturityFields = {
  maturityOption: z.enum(["none", "fixed"]),
  termDays: optionalTermDays,
};

function requireFixedTerm(
  value: { maturityOption: "none" | "fixed"; termDays: number | null },
  context: z.RefinementCtx,
) {
  if (value.maturityOption === "fixed" && value.termDays === null) {
    context.addIssue({ code: "custom", path: ["termDays"], message: "Hãy nhập số ngày vay khi có đáo hạn." });
  }
}

function requireValidReminderOffset(
  value: { interestCycleDays: 15 | 30; interestReminderOffsetDays: number },
  context: z.RefinementCtx,
) {
  if (value.interestReminderOffsetDays >= value.interestCycleDays) {
    context.addIssue({ code: "custom", path: ["interestReminderOffsetDays"], message: "Số ngày nhắc sớm phải nhỏ hơn chu kỳ lãi." });
  }
}

export const counterpartySchema = z.object({
  id: z.union([uuid, z.literal("")]).optional(),
  name: requiredText("Tên đối tác", 120),
  notes: optionalText,
});

export const deleteCounterpartySchema = z.object({ id: uuid });

export const createLoanSchema = z.object({
  counterpartyId: uuid,
  name: optionalLoanName,
  direction: z.enum(["LENDING", "BORROWING"]),
  originalPrincipalVnd: vndAmount,
  disbursementDate: businessDate,
  ...maturityFields,
  interestCycleDays: z.coerce.number().pipe(z.union([z.literal(15), z.literal(30)])),
  interestReminderOffsetDays: z.coerce.number().int().min(0).max(29),
  initialPeriodRatePercent: periodRate,
  notes: optionalText,
  idempotencyKey: uuid,
}).superRefine(requireFixedTerm).superRefine(requireValidReminderOffset).transform((value) => ({
  ...value,
  termDays: value.maturityOption === "fixed" ? value.termDays : null,
}));

export const updateLoanSchema = z.object({
  loanId: uuid,
  counterpartyId: uuid,
  name: optionalLoanName,
  notes: optionalText,
  interestReminderOffsetDays: z.coerce.number().int().min(0).max(29),
});

export const correctLoanTermsSchema = z.object({
  loanId: uuid,
  direction: z.enum(["LENDING", "BORROWING"]),
  originalPrincipalVnd: vndAmount,
  disbursementDate: businessDate,
  ...maturityFields,
  interestCycleDays: z.coerce.number().pipe(z.union([z.literal(15), z.literal(30)])),
  initialPeriodRatePercent: periodRate,
  reason: requiredText("Lý do điều chỉnh", 500),
  confirmation: z.literal("confirmed", { error: "Bạn cần xác nhận đã kiểm tra dữ liệu." }),
  idempotencyKey: uuid,
}).superRefine(requireFixedTerm).transform((value) => ({
  ...value,
  termDays: value.maturityOption === "fixed" ? value.termDays : null,
}));

export const paymentSchema = z.object({
  loanId: uuid,
  type: z.enum(["INTEREST_PAYMENT", "PRINCIPAL_PAYMENT"]),
  transactionDate: businessDate,
  amountVnd: vndAmount,
  note: optionalText,
  idempotencyKey: uuid,
});

export const legacyOnboardingSchema = z.object({
  loanId: uuid,
  asOfDate: businessDate,
  principalOutstandingVnd: vndNonnegative,
  interestCollectedVnd: vndNonnegative,
  badDebtSince: z.union([businessDate, z.literal("")]).transform((value) => value || null),
  note: optionalText,
  confirmation: z.literal("confirmed", { error: "Bạn cần xác nhận số dư mở đầu." }),
  idempotencyKey: uuid,
});

export const expenseSchema = z.object({
  loanId: z.union([uuid, z.literal("")]).transform((value) => value || null),
  transactionDate: businessDate,
  amountVnd: vndAmount,
  category: requiredText("Nhóm chi phí", 80),
  note: optionalText,
  idempotencyKey: uuid,
});

export const lifecycleSchema = z.object({
  loanId: uuid,
  eventType: z.enum(["RATE_CHANGE", "BAD_DEBT_START", "INTEREST_RESUME"]),
  effectiveDate: businessDate,
  periodRatePercent: z
    .union([periodRate, z.literal("")])
    .transform((value) => (value === "" ? null : value)),
  note: optionalText,
  idempotencyKey: uuid,
}).superRefine((value, context) => {
  if (value.eventType === "RATE_CHANGE" && value.periodRatePercent === null) {
    context.addIssue({ code: "custom", path: ["periodRatePercent"], message: "Đổi lãi suất cần nhập mức lãi mới." });
  }
});

export const settlementSchema = z.object({
  loanId: uuid,
  settlementDate: businessDate,
  note: optionalText,
  idempotencyKey: uuid,
  expectedPrincipal: vndNonnegative,
  expectedInterest: vndNonnegative,
  confirmation: z.literal("confirmed", { error: "Hãy xác nhận số tiền tất toán." }),
});

export const reversalSchema = z.object({
  loanId: z.union([uuid, z.literal("")]).transform((value) => value || null),
  transactionId: uuid,
  reversalDate: businessDate,
  note: requiredText("Lý do đảo giao dịch", 500),
  idempotencyKey: uuid,
});

export const settlementReversalSchema = z.object({
  loanId: uuid,
  reversalDate: businessDate,
  reason: requiredText("Lý do hoàn tác tất toán", 500),
  confirmation: z.literal("confirmed", { error: "Bạn cần xác nhận hoàn tác toàn bộ tất toán." }),
  idempotencyKey: uuid,
});

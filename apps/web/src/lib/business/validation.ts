import { z } from "zod";

const requiredText = (label: string, max = 120) =>
  z.string().trim().min(1, `${label} là bắt buộc.`).max(max, `${label} quá dài.`);

const optionalText = z
  .string()
  .trim()
  .max(500, "Ghi chú tối đa 500 ký tự.")
  .transform((value) => value || null);

const uuid = z.uuid("Mã dữ liệu không hợp lệ.");
const businessDate = z.iso.date("Ngày không hợp lệ.");

const vndAmount = z
  .string()
  .trim()
  .transform((value) => value.replace(/[.\s]/g, "").replace(",", ""))
  .refine((value) => /^\d+$/.test(value), "Số tiền phải là số nguyên VND.")
  .transform(Number)
  .refine((value) => Number.isSafeInteger(value) && value > 0, "Số tiền phải lớn hơn 0.");

const dailyRate = z
  .string()
  .trim()
  .transform((value) => value.replace(",", "."))
  .refine((value) => /^\d+(\.\d{1,10})?$/.test(value), "Lãi suất không hợp lệ.")
  .transform(Number)
  .refine((value) => value >= 0 && value <= 100, "Lãi suất phải từ 0 đến 100%/ngày.");

export const counterpartySchema = z.object({
  id: z.union([uuid, z.literal("")]).optional(),
  name: requiredText("Tên đối tác", 120),
  notes: optionalText,
});

export const deleteCounterpartySchema = z.object({ id: uuid });

export const createLoanSchema = z.object({
  counterpartyId: uuid,
  name: requiredText("Tên khoản vay", 120),
  direction: z.enum(["LENDING", "BORROWING"]),
  originalPrincipalVnd: vndAmount,
  disbursementDate: businessDate,
  termDays: z.coerce.number().int().min(1).max(36500),
  interestCycleDays: z.coerce.number().pipe(z.union([z.literal(15), z.literal(30)])),
  initialDailyRatePercent: dailyRate,
  notes: optionalText,
  idempotencyKey: uuid,
});

export const updateLoanSchema = z.object({
  loanId: uuid,
  counterpartyId: uuid,
  name: requiredText("Tên khoản vay", 120),
  notes: optionalText,
});

export const paymentSchema = z.object({
  loanId: uuid,
  type: z.enum(["INTEREST_PAYMENT", "PRINCIPAL_PAYMENT"]),
  transactionDate: businessDate,
  amountVnd: vndAmount,
  note: optionalText,
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
  dailyRatePercent: z
    .union([dailyRate, z.literal("")])
    .transform((value) => (value === "" ? null : value)),
  note: optionalText,
  idempotencyKey: uuid,
}).superRefine((value, context) => {
  if (value.eventType === "RATE_CHANGE" && value.dailyRatePercent === null) {
    context.addIssue({ code: "custom", path: ["dailyRatePercent"], message: "Đổi lãi suất cần nhập mức lãi mới." });
  }
});

export const settlementSchema = z.object({
  loanId: uuid,
  settlementDate: businessDate,
  note: optionalText,
  idempotencyKey: uuid,
});

export const reversalSchema = z.object({
  loanId: uuid,
  transactionId: uuid,
  reversalDate: businessDate,
  note: requiredText("Lý do đảo giao dịch", 500),
  idempotencyKey: uuid,
});

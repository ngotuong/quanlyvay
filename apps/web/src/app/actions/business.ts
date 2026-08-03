"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOwnerProfile, requireWriterProfile } from "@/lib/auth/session";
import {
  counterpartySchema,
  correctLoanTermsSchema,
  createLoanSchema,
  deleteCounterpartySchema,
  expenseSchema,
  lifecycleSchema,
  paymentSchema,
  reversalSchema,
  settlementSchema,
  updateLoanSchema,
} from "@/lib/business/validation";
import { createClient } from "@/lib/supabase/server";
import type { BusinessActionState } from "@/lib/business/action-state";

function values(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function validationFailure(error: { flatten(): { fieldErrors: Record<string, string[]> } }) {
  return {
    ok: false,
    message: "Vui lòng kiểm tra lại các trường được đánh dấu.",
    fieldErrors: error.flatten().fieldErrors,
  } satisfies BusinessActionState;
}

function databaseFailure(message: string): BusinessActionState {
  return { ok: false, message };
}

export async function saveCounterpartyAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = counterpartySchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);

  const supabase = await createClient();
  const { error } = parsed.data.id
    ? await supabase.rpc("update_counterparty", {
        p_counterparty_id: parsed.data.id,
        p_name: parsed.data.name,
        p_notes: parsed.data.notes,
      })
    : await supabase.rpc("create_counterparty", {
        p_name: parsed.data.name,
        p_notes: parsed.data.notes,
      });

  if (error) return databaseFailure("Không thể lưu đối tác. Tên có thể đã tồn tại hoặc dữ liệu không hợp lệ.");
  revalidatePath("/counterparties");
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: parsed.data.id ? "Đã cập nhật đối tác." : "Đã thêm đối tác." };
}

export async function deleteCounterpartyAction(formData: FormData) {
  await requireOwnerProfile();
  const parsed = deleteCounterpartySchema.safeParse(values(formData));
  if (!parsed.success) return;
  const supabase = await createClient();
  await supabase.rpc("delete_counterparty", { p_counterparty_id: parsed.data.id });
  revalidatePath("/counterparties");
}

export async function createLoanAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = createLoanSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_loan_v2", {
    p_counterparty_id: parsed.data.counterpartyId,
    p_name: parsed.data.name,
    p_direction: parsed.data.direction,
    p_original_principal_vnd: parsed.data.originalPrincipalVnd,
    p_disbursement_date: parsed.data.disbursementDate,
    p_term_days: parsed.data.termDays,
    p_interest_cycle_days: parsed.data.interestCycleDays,
    p_initial_period_rate_percent: parsed.data.initialPeriodRatePercent,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_notes: parsed.data.notes,
  });
  if (error || !data) return databaseFailure("Không thể tạo khoản vay. Hãy kiểm tra ngày, số tiền và đối tác.");
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  redirect(`/loans/${data}`);
}

export async function updateLoanAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = updateLoanSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_loan_details", {
    p_loan_id: parsed.data.loanId,
    p_counterparty_id: parsed.data.counterpartyId,
    p_name: parsed.data.name,
    p_notes: parsed.data.notes,
  });
  if (error) return databaseFailure("Không thể cập nhật thông tin khoản vay.");
  revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Đã cập nhật khoản vay." };
}

export async function correctLoanTermsAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = correctLoanTermsSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("correct_loan_terms", {
    p_loan_id: parsed.data.loanId,
    p_direction: parsed.data.direction,
    p_original_principal_vnd: parsed.data.originalPrincipalVnd,
    p_disbursement_date: parsed.data.disbursementDate,
    p_term_days: parsed.data.termDays,
    p_interest_cycle_days: parsed.data.interestCycleDays,
    p_initial_period_rate_percent: parsed.data.initialPeriodRatePercent,
    p_reason: parsed.data.reason,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    if (error.message.includes("existing loan activity")) {
      return databaseFailure("Ngày giải ngân mới không thể sau một giao dịch hoặc sự kiện đã ghi. Hãy chọn ngày sớm hơn.");
    }
    if (error.message.includes("principal already paid")) {
      return databaseFailure("Số tiền gốc mới không thể thấp hơn tổng tiền gốc đã thanh toán.");
    }
    if (error.message.includes("settled loan")) {
      return databaseFailure("Khoản vay đã tất toán nên không thể sửa dữ liệu ban đầu.");
    }
    return databaseFailure("Không thể áp dụng điều chỉnh. Hãy kiểm tra lại ngày, số tiền và lãi suất.");
  }
  revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Đã điều chỉnh dữ liệu ban đầu và lưu đầy đủ lịch sử." };
}

export async function recordPaymentAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = paymentSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_financial_transaction", {
    p_loan_id: parsed.data.loanId,
    p_type: parsed.data.type,
    p_transaction_date: parsed.data.transactionDate,
    p_amount_vnd: parsed.data.amountVnd,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_note: parsed.data.note,
  });
  if (error) return databaseFailure("Không thể ghi nhận thanh toán. Số tiền gốc có thể vượt dư nợ.");
  revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Đã ghi nhận thanh toán." };
}

export async function recordExpenseAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = expenseSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_expense", {
    p_loan_id: parsed.data.loanId,
    p_transaction_date: parsed.data.transactionDate,
    p_amount_vnd: parsed.data.amountVnd,
    p_category: parsed.data.category,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_note: parsed.data.note,
  });
  if (error) return databaseFailure("Không thể ghi nhận chi phí.");
  if (parsed.data.loanId) revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/expenses");
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Đã ghi nhận chi phí." };
}

export async function recordLifecycleAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = lifecycleSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_lifecycle_event_v2", {
    p_loan_id: parsed.data.loanId,
    p_event_type: parsed.data.eventType,
    p_effective_date: parsed.data.effectiveDate,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_period_rate_percent: parsed.data.periodRatePercent,
    p_note: parsed.data.note,
  });
  if (error) return databaseFailure("Không thể cập nhật trạng thái hoặc lãi suất tại ngày đã chọn.");
  revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Đã cập nhật lịch sử khoản vay." };
}

export async function settleLoanAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = settlementSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("settle_loan", {
    p_loan_id: parsed.data.loanId,
    p_settlement_date: parsed.data.settlementDate,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_note: parsed.data.note,
  });
  if (error) return databaseFailure("Không thể tất toán. Hãy kiểm tra số dư lãi trả thừa và ngày tất toán.");
  revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Khoản vay đã được tất toán." };
}

export async function reverseTransactionAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = reversalSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("reverse_transaction", {
    p_transaction_id: parsed.data.transactionId,
    p_reversal_date: parsed.data.reversalDate,
    p_note: parsed.data.note,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return databaseFailure("Không thể đảo giao dịch này. Giao dịch có thể đã được đảo trước đó.");
  if (parsed.data.loanId) revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/expenses");
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Đã tạo giao dịch đảo." };
}

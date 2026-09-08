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
  legacyOnboardingSchema,
  paymentSchema,
  reversalSchema,
  settlementReversalSchema,
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
  const { data, error } = parsed.data.id
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
  return { ok: true, message: parsed.data.id ? "Đã cập nhật đối tác." : "Đã thêm đối tác.", createdId: typeof data === "string" ? data : undefined };
}

export async function deleteCounterpartyAction(_state: BusinessActionState, formData: FormData): Promise<BusinessActionState> {
  await requireOwnerProfile();
  const parsed = deleteCounterpartySchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_counterparty", { p_counterparty_id: parsed.data.id });
  if (error) return databaseFailure("Không thể xóa đối tác đã có lịch sử khoản vay. Nếu đối tác chưa có lịch sử, hãy kiểm tra kết nối và thử lại.");
  revalidatePath("/counterparties");
  redirect("/counterparties?deleted=1");
}

export async function createLoanAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = createLoanSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_loan_v3", {
    p_counterparty_id: parsed.data.counterpartyId,
    p_name: parsed.data.name,
    p_direction: parsed.data.direction,
    p_original_principal_vnd: parsed.data.originalPrincipalVnd,
    p_disbursement_date: parsed.data.disbursementDate,
    p_term_days: parsed.data.termDays,
    p_interest_cycle_days: parsed.data.interestCycleDays,
    p_initial_period_rate_percent: parsed.data.initialPeriodRatePercent,
    p_interest_reminder_offset_days: parsed.data.interestReminderOffsetDays,
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
  const { error } = await supabase.rpc("update_loan_details_v2", {
    p_loan_id: parsed.data.loanId,
    p_counterparty_id: parsed.data.counterpartyId,
    p_name: parsed.data.name,
    p_notes: parsed.data.notes,
    p_interest_reminder_offset_days: parsed.data.interestReminderOffsetDays,
  });
  if (error) return databaseFailure("Không thể cập nhật thông tin khoản vay.");
  revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Đã cập nhật khoản vay." };
}

export async function onboardLegacyLoanAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = legacyOnboardingSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("onboard_legacy_loan", {
    p_loan_id: parsed.data.loanId,
    p_as_of_date: parsed.data.asOfDate,
    p_principal_outstanding_vnd: parsed.data.principalOutstandingVnd,
    p_interest_collected_vnd: parsed.data.interestCollectedVnd,
    p_bad_debt_since: parsed.data.badDebtSince,
    p_note: parsed.data.note,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) {
    if (error.message.includes("without recorded activity")) {
      return databaseFailure("Khoản vay đã có giao dịch hoặc sự kiện nên không thể áp dụng số dư mở đầu tự động.");
    }
    return databaseFailure("Không thể khởi tạo số dư khoản vay cũ. Hãy kiểm tra ngày và số tiền.");
  }
  revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Đã ghi nhận số dư mở đầu và trạng thái khoản vay cũ." };
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
  const { error } = await supabase.rpc("settle_loan_confirmed", {
    p_loan_id: parsed.data.loanId,
    p_settlement_date: parsed.data.settlementDate,
    p_idempotency_key: parsed.data.idempotencyKey,
    p_note: parsed.data.note,
    p_expected_principal: parsed.data.expectedPrincipal,
    p_expected_interest: parsed.data.expectedInterest,
  });
  if (error?.code === "PT409") return databaseFailure("Số tiền đã thay đổi. Hãy tải lại bảng tất toán và xác nhận lại.");
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

export async function reverseSettlementAction(
  _state: BusinessActionState,
  formData: FormData,
): Promise<BusinessActionState> {
  await requireWriterProfile();
  const parsed = settlementReversalSchema.safeParse(values(formData));
  if (!parsed.success) return validationFailure(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("reverse_settlement", {
    p_loan_id: parsed.data.loanId,
    p_reversal_date: parsed.data.reversalDate,
    p_reason: parsed.data.reason,
    p_idempotency_key: parsed.data.idempotencyKey,
  });
  if (error) return databaseFailure("Không thể hoàn tác tất toán. Khoản vay có thể đã được hoàn tác hoặc ngày không hợp lệ.");
  revalidatePath(`/loans/${parsed.data.loanId}`);
  revalidatePath("/loans");
  revalidatePath("/dashboard");
  return { ok: true, message: "Đã hoàn tác toàn bộ tất toán và tính lại khoản vay." };
}

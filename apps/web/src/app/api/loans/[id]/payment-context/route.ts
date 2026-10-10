import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { paymentSchema } from "@/lib/business/validation";
import { readRpcWithGatewayRetry } from "@/lib/business/read-rpc-retry.mjs";
import type { CalculationSnapshot } from "@/lib/business/types";
import type { PaymentContext } from "@/lib/business/payment-context";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  const profile = await getAuthenticatedProfile();
  if (!profile || profile.must_change_password) return reply({ error: "Phiên đăng nhập không còn hợp lệ. Hãy đăng nhập lại.", context: null }, 401);
  if (profile.role === "VIEWER") return reply({ error: "Tài khoản chỉ xem không thể ghi giao dịch.", context: null }, 403);
  const { id } = await params;
  const date = request.nextUrl.searchParams.get("date");
  const check = paymentSchema.pick({ loanId: true, transactionDate: true }).safeParse({ loanId: id, transactionDate: date });
  if (!check.success) return reply({ error: "Khoản vay hoặc ngày thanh toán không hợp lệ.", context: null }, 400);
  const supabase = await createClient();
  const loan = await supabase.from("loans").select("id,name,direction,counterparties(name)").eq("id", id).maybeSingle();
  if (loan.error || !loan.data) return reply({ error: "Không thể tải khoản vay. Kiểm tra quyền truy cập rồi thử lại.", context: null }, 404);
  const calculated = await readRpcWithGatewayRetry("calculate_loan", () => supabase.rpc("calculate_loan", { p_loan_id: id, p_as_of_date: check.data.transactionDate }));
  if (calculated.error || !calculated.data) return reply({ error: "Chưa thể tải số dư. Kiểm tra ngày thanh toán rồi thử lại.", context: null }, 422);
  const snapshot = calculated.data as CalculationSnapshot;
  const counterparty = loan.data.counterparties as unknown as { name: string } | null;
  const context: PaymentContext = { loanId: id, name: loan.data.name, counterpartyName: counterparty?.name ?? "", direction: loan.data.direction, status: snapshot.status, asOfDate: snapshot.asOfDate, principalOutstandingVnd: snapshot.principalOutstandingVnd, interestBalanceVnd: snapshot.interestBalanceVnd };
  return reply({ error: "", context });
}

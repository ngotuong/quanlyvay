import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { settlementSchema } from "@/lib/business/validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  const profile = await getAuthenticatedProfile();
  if (!profile || profile.must_change_password) return reply({ error: "Phiên đăng nhập không còn hợp lệ. Hãy đăng nhập lại.", preview: null }, 401);
  if (profile.role === "VIEWER") return reply({ error: "Tài khoản chỉ xem không thể tất toán.", preview: null }, 403);
  const { id } = await params;
  const date = request.nextUrl.searchParams.get("date");
  const check = settlementSchema.pick({ loanId: true, settlementDate: true }).safeParse({ loanId: id, settlementDate: date });
  if (!check.success) return reply({ error: "Ngày tất toán không hợp lệ.", preview: null }, 400);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_settlement", { p_loan_id: id, p_settlement_date: date });
  if (error || !data) return reply({ error: "Chưa thể tính tất toán. Kiểm tra ngày, trạng thái khoản vay và số dư lãi trả thừa.", preview: null }, 422);
  return reply({ error: "", preview: data });
}

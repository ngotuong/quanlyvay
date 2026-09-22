import { NextResponse, type NextRequest } from "next/server";
import { getAuthenticatedProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { principalRestructureSchema } from "@/lib/business/validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
  const profile = await getAuthenticatedProfile();
  if (!profile || profile.must_change_password) return reply({ error: "Phiên đăng nhập không còn hợp lệ. Hãy đăng nhập lại.", preview: null }, 401);
  if (profile.role === "VIEWER") return reply({ error: "Tài khoản chỉ xem không thể giảm gốc.", preview: null }, 403);

  const { id } = await params;
  const effectiveDate = request.nextUrl.searchParams.get("effectiveDate");
  const principalPaymentVnd = request.nextUrl.searchParams.get("principalPaymentVnd");
  const check = principalRestructureSchema.pick({ loanId: true, effectiveDate: true, principalPaymentVnd: true }).safeParse({
    loanId: id,
    effectiveDate,
    principalPaymentVnd,
  });
  if (!check.success) return reply({ error: "Ngày hiệu lực hoặc số tiền gốc không hợp lệ.", preview: null }, 400);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_principal_restructure", {
    p_loan_id: id,
    p_effective_date: check.data.effectiveDate,
    p_principal_payment_vnd: check.data.principalPaymentVnd,
  });
  if (error || !data) {
    const message = error?.message.includes("Use settlement")
      ? "Số tiền này sẽ trả hết gốc. Hãy dùng chức năng Tất toán."
      : "Chưa thể tính phương án. Chỉ khoản vay đang hoạt động và còn dư gốc mới dùng được nghiệp vụ này.";
    return reply({ error: message, preview: null }, 422);
  }
  return reply({ error: "", preview: data });
}

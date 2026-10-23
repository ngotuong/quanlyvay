"use server";

import { redirect } from "next/navigation";
import { internalEmailForUsername } from "@/lib/auth/config";
import type { AuthActionState } from "@/lib/auth/types";
import { changePasswordSchema, loginSchema } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { passwordChangeCompletionMetadata } from "@/lib/auth/password-change.mjs";
import { reconcileCompletedPasswordChange } from "@/lib/auth/password-change-recovery";

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Vui lòng kiểm tra lại thông tin đăng nhập.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: signInError,
  } = await supabase.auth.signInWithPassword({
    email: internalEmailForUsername(parsed.data.username),
    password: parsed.data.password,
  });

  if (signInError || !user) {
    return {
      status: "error",
      message: "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, must_change_password, password_reset_generation, is_active")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile?.is_active) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.",
    };
  }

  const reconciled = await reconcileCompletedPasswordChange(user, profile);
  redirect(reconciled.must_change_password ? "/change-password" : "/dashboard");
}

export async function changePasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Mật khẩu mới chưa đáp ứng yêu cầu.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("user_id,must_change_password,password_reset_generation,is_active")
    .eq("user_id", user.id)
    .single();
  if (profileReadError || !profile?.is_active) {
    return { status: "error", message: "Không thể xác minh hồ sơ tài khoản. Vui lòng đăng nhập lại." };
  }

  const admin = createAdminClient();
  const authUpdate = profile.must_change_password
    ? {
        password: parsed.data.password,
        app_metadata: passwordChangeCompletionMetadata(user.app_metadata, profile.password_reset_generation),
      }
    : { password: parsed.data.password };
  const { error: passwordError } = await admin.auth.admin.updateUserById(user.id, authUpdate);

  if (passwordError) {
    console.error("auth.update_password_failed", {
      code: passwordError.code,
      status: passwordError.status,
    });
    return {
      status: "error",
      message: passwordError.code === "weak_password"
        ? "Mật khẩu bị máy chủ từ chối do chính sách bảo mật. Vui lòng thử mật khẩu khác."
        : "Chưa thể đổi mật khẩu. Vui lòng kiểm tra kết nối và thử lại.",
    };
  }

  const { error: sessionError } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: parsed.data.password,
  });
  if (sessionError) {
    console.error("auth.password_session_refresh_failed", {
      code: sessionError.code,
      status: sessionError.status,
    });
    return {
      status: "error",
      message: "Mật khẩu đã đổi an toàn. Hãy đăng nhập lại bằng mật khẩu mới để tiếp tục.",
    };
  }

  if (!profile.must_change_password) redirect("/dashboard");

  const { data: completedProfile, error: profileError } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("user_id", user.id)
    .eq("password_reset_generation", profile.password_reset_generation)
    .eq("must_change_password", true)
    .select("user_id")
    .maybeSingle();

  if (profileError || !completedProfile) {
    return {
      status: "error",
      message: "Mật khẩu đã đổi an toàn. Hãy tải lại trang để hoàn tất đồng bộ hồ sơ.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

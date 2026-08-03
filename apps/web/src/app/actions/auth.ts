"use server";

import { redirect } from "next/navigation";
import { internalEmailForUsername } from "@/lib/auth/config";
import type { AuthActionState } from "@/lib/auth/types";
import { changePasswordSchema, loginSchema } from "@/lib/auth/validation";
import { createClient } from "@/lib/supabase/server";

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
    .select("must_change_password, is_active")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile?.is_active) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng thử lại.",
    };
  }

  redirect(profile.must_change_password ? "/change-password" : "/dashboard");
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

  const { error: passwordError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

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

  const { error: profileError } = await supabase.rpc("complete_password_change");

  if (profileError) {
    return {
      status: "error",
      message: "Mật khẩu đã đổi nhưng chưa cập nhật được hồ sơ. Vui lòng đăng nhập lại.",
    };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

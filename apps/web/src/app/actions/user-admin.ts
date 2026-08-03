"use server";

import { revalidatePath } from "next/cache";
import { internalEmailForUsername } from "@/lib/auth/config";
import { requireOwnerProfile } from "@/lib/auth/session";
import {
  createManagedUserSchema,
  manageProfileSchema,
  resetManagedUserPasswordSchema,
} from "@/lib/auth/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type UserAdminResult =
  | { ok: true; userId: string }
  | { ok: false; message: string };

export async function createManagedUser(input: unknown): Promise<UserAdminResult> {
  await requireOwnerProfile();
  const parsed = createManagedUserSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Thông tin tài khoản mới chưa hợp lệ." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: internalEmailForUsername(parsed.data.username),
    password: parsed.data.temporaryPassword,
    email_confirm: true,
    user_metadata: {
      provisioned_by_app: "true",
      username: parsed.data.username,
      display_name: parsed.data.displayName,
      app_role: parsed.data.role,
    },
  });

  if (error || !data.user) {
    return {
      ok: false,
      message: error?.message.includes("already")
        ? "Tên đăng nhập đã tồn tại."
        : "Không thể tạo tài khoản. Hệ thống chỉ hỗ trợ tối đa hai người dùng.",
    };
  }

  revalidatePath("/settings");
  return { ok: true, userId: data.user.id };
}

export async function manageUserProfile(input: unknown): Promise<UserAdminResult> {
  const owner = await requireOwnerProfile();
  const parsed = manageProfileSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Thông tin phân quyền chưa hợp lệ." };
  }
  if (parsed.data.userId === owner.user_id) {
    return { ok: false, message: "Màn hình này chỉ quản lý tài khoản thứ hai." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("manage_profile", {
    p_user_id: parsed.data.userId,
    p_display_name: parsed.data.displayName,
    p_role: parsed.data.role,
    p_is_active: parsed.data.isActive,
  });

  if (error) {
    return { ok: false, message: "Không thể cập nhật tài khoản này." };
  }

  revalidatePath("/settings");
  return { ok: true, userId: parsed.data.userId };
}

export async function resetManagedUserPassword(input: unknown): Promise<UserAdminResult> {
  const owner = await requireOwnerProfile();
  const parsed = resetManagedUserPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Yêu cầu đặt lại mật khẩu chưa hợp lệ." };
  }
  if (parsed.data.userId === owner.user_id) {
    return { ok: false, message: "Hãy dùng chức năng đổi mật khẩu của chính bạn." };
  }

  const supabase = await createClient();
  const { data: managedProfile, error: managedProfileError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", parsed.data.userId)
    .neq("role", "OWNER")
    .single();

  if (managedProfileError || !managedProfile) {
    return { ok: false, message: "Không tìm thấy tài khoản thứ hai cần đặt lại mật khẩu." };
  }

  const { error: profileError } = await supabase.rpc("mark_password_reset_required", {
    p_user_id: parsed.data.userId,
  });

  if (profileError) {
    return { ok: false, message: "Không thể đánh dấu yêu cầu đổi mật khẩu." };
  }

  const admin = createAdminClient();
  const { error: passwordError } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    password: parsed.data.temporaryPassword,
  });

  if (passwordError) {
    return { ok: false, message: "Không thể đặt lại mật khẩu tạm thời; tài khoản vẫn bị yêu cầu đổi mật khẩu vì an toàn." };
  }

  revalidatePath("/settings");
  return { ok: true, userId: parsed.data.userId };
}

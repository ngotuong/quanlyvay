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

  revalidatePath("/");
  return { ok: true, userId: data.user.id };
}

export async function manageUserProfile(input: unknown): Promise<UserAdminResult> {
  await requireOwnerProfile();
  const parsed = manageProfileSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Thông tin phân quyền chưa hợp lệ." };
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

  revalidatePath("/");
  return { ok: true, userId: parsed.data.userId };
}

export async function resetManagedUserPassword(input: unknown): Promise<UserAdminResult> {
  await requireOwnerProfile();
  const parsed = resetManagedUserPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Yêu cầu đặt lại mật khẩu chưa hợp lệ." };
  }

  const admin = createAdminClient();
  const { error: passwordError } = await admin.auth.admin.updateUserById(parsed.data.userId, {
    password: parsed.data.temporaryPassword,
  });

  if (passwordError) {
    return { ok: false, message: "Không thể đặt lại mật khẩu tạm thời." };
  }

  const supabase = await createClient();
  const { error: profileError } = await supabase.rpc("mark_password_reset_required", {
    p_user_id: parsed.data.userId,
  });

  if (profileError) {
    return { ok: false, message: "Mật khẩu đã đổi nhưng chưa cập nhật được trạng thái hồ sơ." };
  }

  return { ok: true, userId: parsed.data.userId };
}

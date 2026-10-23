import "server-only";

import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { canReconcilePasswordChange } from "./password-change.mjs";

type PasswordChangeProfile = {
  user_id: string;
  must_change_password: boolean;
  password_reset_generation: number;
};

export async function reconcileCompletedPasswordChange<T extends PasswordChangeProfile>(
  user: User,
  profile: T,
): Promise<T> {
  if (!canReconcilePasswordChange(user.id, user.app_metadata, profile)) return profile;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ must_change_password: false })
    .eq("user_id", user.id)
    .eq("password_reset_generation", profile.password_reset_generation)
    .eq("must_change_password", true)
    .select("user_id,must_change_password,password_reset_generation")
    .maybeSingle();

  if (error) {
    console.error("auth.password_profile_recovery_failed", { code: error.code });
    return profile;
  }
  if (data) return { ...profile, must_change_password: false };

  const current = await admin
    .from("profiles")
    .select("user_id,must_change_password,password_reset_generation")
    .eq("user_id", user.id)
    .maybeSingle();
  if (current.error || !current.data) return profile;
  return { ...profile, ...current.data };
}

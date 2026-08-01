import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppProfile } from "./types";

export async function getAuthenticatedProfile(): Promise<AppProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username, display_name, role, must_change_password, is_active")
    .eq("user_id", user.id)
    .single();

  if (error || !data || !data.is_active) {
    return null;
  }

  return data as AppProfile;
}

export async function requireAuthenticatedProfile(options?: { allowPasswordChange?: boolean }) {
  const profile = await getAuthenticatedProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.must_change_password && !options?.allowPasswordChange) {
    redirect("/change-password");
  }

  return profile;
}

export async function requireOwnerProfile() {
  const profile = await requireAuthenticatedProfile();

  if (profile.role !== "OWNER") {
    throw new Error("Bạn không có quyền quản lý tài khoản.");
  }

  return profile;
}

import "server-only";

import { cache } from "react";
import { readWithTiming } from "@/lib/app/read-timing.mjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AppProfile } from "./types";
import { reconcileCompletedPasswordChange } from "./password-change-recovery";

export const getAuthenticatedProfile = cache(async (): Promise<AppProfile | null> => {
  if (process.env.E2E_AUTH_DELAY_ENABLED === "true" && ["http://127.0.0.1:55321", "http://127.0.0.1:54321"].includes(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")) {
    const requestedDelay = Number((await headers()).get("x-e2e-auth-delay-ms") ?? 0);
    if (Number.isFinite(requestedDelay) && requestedDelay > 0 && requestedDelay <= 10_000) {
      await new Promise(resolve => setTimeout(resolve, requestedDelay));
    }
  }
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await readWithTiming("auth.user", () => supabase.auth.getUser());

  if (userError || !user) {
    return null;
  }

  const { data, error } = await readWithTiming("profile.read", () => supabase
    .from("profiles")
    .select("user_id, username, display_name, role, must_change_password, password_reset_generation, is_active, notification_delivery_hour")
    .eq("user_id", user.id)
    .single());

  if (error || !data || !data.is_active) {
    return null;
  }

  return reconcileCompletedPasswordChange(user, data as AppProfile);
});

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
    redirect("/dashboard");
  }

  return profile;
}

export async function requireWriterProfile() {
  const profile = await requireAuthenticatedProfile();

  if (profile.role === "VIEWER") {
    throw new Error("Tài khoản chỉ xem không thể thay đổi dữ liệu.");
  }

  return profile;
}

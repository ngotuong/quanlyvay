import { createClient } from "@supabase/supabase-js";

const username = process.env.BOOTSTRAP_USERNAME?.trim().toLowerCase();
const displayName = process.env.BOOTSTRAP_DISPLAY_NAME?.trim();
const password = process.env.BOOTSTRAP_PASSWORD;
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!username || !/^[a-z0-9._-]{3,32}$/.test(username)) {
  throw new Error("BOOTSTRAP_USERNAME không hợp lệ.");
}

if (!displayName) {
  throw new Error("Thiếu BOOTSTRAP_DISPLAY_NAME.");
}

if (
  !password ||
  password.length < 10 ||
  !/[a-z]/.test(password) ||
  !/[A-Z]/.test(password) ||
  !/[0-9]/.test(password)
) {
  throw new Error("BOOTSTRAP_PASSWORD cần ít nhất 10 ký tự, có chữ hoa, chữ thường và chữ số.");
}

if (!url || !secretKey) {
  throw new Error("Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SECRET_KEY.");
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
});

const { data, error } = await admin.auth.admin.createUser({
  email: `${username}@auth.local`,
  password,
  email_confirm: true,
  user_metadata: {
    provisioned_by_app: "true",
    username,
    display_name: displayName,
    app_role: "OWNER",
  },
});

if (error || !data.user) {
  throw new Error(error?.message || "Không thể bootstrap OWNER.");
}

process.stdout.write(`Đã bootstrap OWNER local: ${username}\n`);

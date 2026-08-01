export const APP_ROLES = ["OWNER", "EDITOR", "VIEWER"] as const;
export type AppRole = (typeof APP_ROLES)[number];

export type AppProfile = {
  user_id: string;
  username: string;
  display_name: string;
  role: AppRole;
  must_change_password: boolean;
  is_active: boolean;
};

export type AuthActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<"username" | "password" | "confirmPassword", string[]>>;
};

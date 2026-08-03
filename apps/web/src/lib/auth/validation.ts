import { z } from "zod";
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from "@/lib/auth/password-policy.mjs";

const username = z
  .string()
  .trim()
  .min(3, "Tên đăng nhập cần ít nhất 3 ký tự.")
  .max(32, "Tên đăng nhập tối đa 32 ký tự.")
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .string()
      .regex(/^[a-z0-9._-]+$/, "Chỉ dùng chữ, số, dấu chấm, gạch dưới hoặc gạch ngang."),
  );

export const loginSchema = z.object({
  username,
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

const accountPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự.`)
  .regex(new RegExp(`^${PASSWORD_PATTERN}$`), "Mật khẩu chỉ được gồm chữ hoặc số.");

export const changePasswordSchema = z
  .object({
    password: accountPassword,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Mật khẩu xác nhận chưa khớp.",
    path: ["confirmPassword"],
  });

export const createManagedUserSchema = z.object({
  username,
  displayName: z.string().trim().min(1).max(80),
  role: z.enum(["EDITOR", "VIEWER"]),
  temporaryPassword: accountPassword,
});

export const manageProfileSchema = z.object({
  userId: z.uuid(),
  displayName: z.string().trim().min(1).max(80),
  role: z.enum(["EDITOR", "VIEWER"]),
  isActive: z.boolean(),
});

export const resetManagedUserPasswordSchema = z.object({
  userId: z.uuid(),
  temporaryPassword: accountPassword,
});

import { z } from "zod";

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

const strongPassword = z
  .string()
  .min(10, "Mật khẩu cần ít nhất 10 ký tự.")
  .regex(/[a-z]/, "Mật khẩu cần có chữ thường.")
  .regex(/[A-Z]/, "Mật khẩu cần có chữ hoa.")
  .regex(/[0-9]/, "Mật khẩu cần có chữ số.");

export const changePasswordSchema = z
  .object({
    password: strongPassword,
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
  temporaryPassword: strongPassword,
});

export const manageProfileSchema = z.object({
  userId: z.uuid(),
  displayName: z.string().trim().min(1).max(80),
  role: z.enum(["EDITOR", "VIEWER"]),
  isActive: z.boolean(),
});

export const resetManagedUserPasswordSchema = z.object({
  userId: z.uuid(),
  temporaryPassword: strongPassword,
});

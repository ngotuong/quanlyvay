import "server-only";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string) {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

export function internalEmailForUsername(value: string) {
  const username = normalizeUsername(value);

  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("Tên đăng nhập không hợp lệ.");
  }

  return `${username}@auth.local`;
}

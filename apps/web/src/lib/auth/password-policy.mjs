export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_PATTERN = "[A-Za-z0-9]+";
export const PASSWORD_REQUIREMENTS = "Ít nhất 6 ký tự, chỉ gồm chữ hoặc số.";

const passwordPattern = new RegExp(`^${PASSWORD_PATTERN}$`);

/** @param {unknown} value */
export function isValidPassword(value) {
  return typeof value === "string"
    && value.length >= PASSWORD_MIN_LENGTH
    && passwordPattern.test(value);
}

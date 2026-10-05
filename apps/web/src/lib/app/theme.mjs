export const themeCookieName = "qlv_theme";
export function parseTheme(value) {
  return value === "light" || value === "dark" ? value : "system";
}
export function themeColors(preference) {
  const theme = parseTheme(preference);
  return [
    { media: "(prefers-color-scheme: light)", color: theme === "dark" ? "#0b1220" : "#eaf0f8" },
    { media: "(prefers-color-scheme: dark)", color: theme === "light" ? "#eaf0f8" : "#0b1220" },
  ];
}

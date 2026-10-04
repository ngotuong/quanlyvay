export const themeCookieName = "qlv_theme";
export function parseTheme(value) {
  return value === "light" || value === "dark" ? value : "system";
}
export function themeColors(preference) {
  const theme = parseTheme(preference);
  return [
    { media: "(prefers-color-scheme: light)", color: theme === "dark" ? "#090d18" : "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: theme === "light" ? "#f6f7fb" : "#090d18" },
  ];
}

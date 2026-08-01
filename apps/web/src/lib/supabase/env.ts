function requiredEnvironmentValue(name: string, rawValue: string | undefined) {
  const value = rawValue?.trim();

  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name}.`);
  }

  return value;
}

export function publicSupabaseEnvironment() {
  return {
    url: requiredEnvironmentValue(
      "NEXT_PUBLIC_SUPABASE_URL",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    publishableKey: requiredEnvironmentValue(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    ),
  };
}

export function secretSupabaseEnvironment() {
  return {
    ...publicSupabaseEnvironment(),
    secretKey: requiredEnvironmentValue("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY),
  };
}

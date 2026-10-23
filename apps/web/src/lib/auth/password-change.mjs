export const passwordChangeGenerationKey = "password_change_generation";

export function passwordChangeCompletionGeneration(appMetadata) {
  if (!appMetadata || typeof appMetadata !== "object") return null;
  const generation = appMetadata[passwordChangeGenerationKey];
  return Number.isSafeInteger(generation) && generation >= 0 ? generation : null;
}

export function passwordChangeCompletionMetadata(appMetadata, generation) {
  if (!Number.isSafeInteger(generation) || generation < 0) {
    throw new Error("Invalid password reset generation");
  }
  return { ...(appMetadata ?? {}), [passwordChangeGenerationKey]: generation };
}

export function canReconcilePasswordChange(userId, appMetadata, profile) {
  return profile.user_id === userId
    && profile.must_change_password === true
    && passwordChangeCompletionGeneration(appMetadata) === profile.password_reset_generation;
}

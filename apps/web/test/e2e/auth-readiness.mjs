export async function waitForAuthReady({
  healthUrl,
  headers,
  timeoutMs = 180_000,
  requestTimeoutMs = 2_000,
  fetchImpl = fetch,
  sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
  now = () => Date.now(),
}) {
  const startedAt = now();
  let attempt = 0;
  let lastFailure = "unknown error";

  while (now() - startedAt < timeoutMs) {
    attempt += 1;
    try {
      const response = await fetchImpl(healthUrl, {
        headers,
        signal: AbortSignal.timeout(requestTimeoutMs),
      });
      if (response.ok) return { attempt, elapsedMs: now() - startedAt };
      lastFailure = `HTTP ${response.status}`;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }

    const remainingMs = timeoutMs - (now() - startedAt);
    if (remainingMs <= 0) break;
    const backoffMs = Math.min(250 * (2 ** Math.min(attempt - 1, 4)), 2_000, remainingMs);
    await sleep(backoffMs);
  }

  throw new Error(`Local Supabase Auth was not ready after ${attempt} attempts: ${lastFailure}`);
}

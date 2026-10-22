const operations = new Set(["auth.user", "profile.read", "notifications.count", "dashboard.bundle", "dashboard.attention-metadata", "loans.page", "counterparties.list"]);

/**
 * Observe an existing read without changing its result, retries or error.
 * Logs contain only a fixed category, duration and outcome; never the result,
 * request arguments, error message, identity or credentials.
 * @template T
 * @param {string} operation
 * @param {() => PromiseLike<T>} execute
 * @returns {Promise<T>}
 */
export async function readWithTiming(operation, execute) {
  const category = operations.has(operation) ? operation : "other";
  const started = performance.now();
  const record = outcome => {
    try { console.info("app.read.timing", JSON.stringify({ operation: category, durationMs: Math.round((performance.now() - started) * 10) / 10, outcome })); }
    catch { /* Observability must never affect the authoritative read. */ }
  };
  try {
    const result = await execute();
    record(result && typeof result === "object" && "error" in result && result.error ? "error" : "ok");
    return result;
  } catch (error) {
    record("error");
    throw error;
  }
}

/**
 * Classify failed reads without emitting messages, URLs, SQL, payloads or credentials.
 * @param {{ data?: unknown, error?: unknown, status?: number }} result
 */
export function readFailureDiagnostic(result) {
  const error = result.error && typeof result.error === "object" ? result.error : null;
  const code = error && "code" in error && typeof error.code === "string" ? error.code : "";
  const message = error && "message" in error && typeof error.message === "string" ? error.message : "";
  const safeCode = /^(?:[0-9]{2}[0-9A-Z]{3}|P000[0-4]|PGRST[0-9]{3})$/.test(code) ? code : null;
  const kind = result.error
    ? safeCode ? "database"
      : /AbortError|aborted/i.test(message) ? "aborted"
      : /fetch failed|network|ECONNRESET|ECONNREFUSED|UND_ERR_/i.test(message) ? "transport"
        : "unknown"
    : result.data == null ? "empty" : "none";
  return {
    kind,
    code: safeCode,
    status: Number.isInteger(result.status) && result.status >= 0 && result.status <= 599 ? result.status : null,
  };
}

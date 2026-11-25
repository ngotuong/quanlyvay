const tokenPattern = /^[0-9a-f]{64}$/;
// Bound the stream itself, not just the untrusted Content-Length header.
export async function parseReceiptRequest(request) {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") return null;
  if (!request.body) return null;
  const reader = request.body.getReader();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; void reader.cancel().catch(() => undefined); }, 3000);
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 512) { await reader.cancel(); return null; }
      chunks.push(value);
    }
    if (timedOut) return null;
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.token !== "string" || !tokenPattern.test(data.token)) return null;
    const fields = Object.keys(data).sort().join(",");
    if (data.stage === "RECEIVED" && fields === "stage,token") return data;
    if (data.stage === "COMPLETED" && fields === "badgeResult,notificationResult,stage,token"
      && ["SUCCEEDED", "FAILED", "DEFERRED"].includes(data.notificationResult)
      && ["SUCCEEDED", "FAILED", "UNSUPPORTED", "SKIPPED"].includes(data.badgeResult)) return data;
  } catch { /* Malformed/untrusted body. Never log the capability. */ }
  finally { clearTimeout(timer); reader.releaseLock(); }
  return null;
}

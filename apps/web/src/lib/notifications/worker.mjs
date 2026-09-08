// Adapter callbacks keep the bounded queue algorithm testable without sending real Push.
export async function drainPushQueue({ claim, send, complete, remove, now = Date.now, startedAt = now(), budgetMs = 40000, batchSize = 5, maxBatches = 200 }) {
  const result = { claimed: 0, sent: 0, failed: 0, stateUpdateFailed: 0, queueRemaining: true };
  for (let batch = 0; batch < maxBatches && now() - startedAt < budgetMs; batch += 1) {
    const deliveries = await claim(batchSize);
    if (!deliveries.length) { result.queueRemaining = false; break; }
    result.claimed += deliveries.length;
    await Promise.all(deliveries.map(async delivery => {
      let succeeded = false;
      let message = null;
      let stale = false;
      try { await send(delivery, { timeout: 5000 }); succeeded = true; }
      catch (error) {
        // Do not persist endpoint/key-bearing provider errors in the database.
        const status = Number(error?.statusCode ?? 0);
        message = status ? `Push HTTP ${status}` : "Push network failure or timeout";
        stale = status === 404 || status === 410;
      }
      let completed = false;
      for (let attempt = 0; attempt < 3 && !completed; attempt += 1) {
        try { completed = await complete(delivery, succeeded, message); } catch { /* lease handles retry */ }
      }
      if (completed) result[succeeded ? "sent" : "failed"] += 1;
      else result.stateUpdateFailed += 1;
      if (stale) { try { await remove(delivery); } catch { /* retry on the next lease */ } }
    }));
    result.queueRemaining = deliveries.length === batchSize;
    if (!result.queueRemaining) break;
  }
  return result;
}

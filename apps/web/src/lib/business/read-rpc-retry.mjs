import { readFailureDiagnostic } from "./read-failure-diagnostics.mjs";

// Explicit STABLE/read-only RPCs only. Financial mutations must never enter this helper.
const allowed = new Set([
  "get_management_dashboard_bundle_v3", "get_management_dashboard_bundle_v2",
  "list_loan_summaries_page", "list_loan_summaries", "calculate_loan",
  "get_loan_term_summary", "get_loan_schedule_summary", "get_loan_management_summary",
]);

/**
 * @template {{ error?: unknown, status?: number }} T
 * @param {string} operation
 * @param {() => PromiseLike<T>} read
 * @param {(ms: number) => Promise<void>} [pause]
 * @returns {Promise<T>}
 */
export async function readRpcWithGatewayRetry(operation, read, pause = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  if (!allowed.has(operation)) throw new Error("RPC is not approved for read-only gateway retry.");
  const first = await read();
  const diagnostic = readFailureDiagnostic(first);
  if (!first.error || diagnostic.code || diagnostic.kind === "aborted" || ![502, 503, 504].includes(diagnostic.status ?? -1)) return first;
  console.warn("rpc.read_gateway_retry", { operation, ...diagnostic, attempt: 2 });
  await pause(100);
  return await read();
}

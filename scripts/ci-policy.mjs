#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const workflowPath = process.argv[2] ?? ".github/workflows/ci.yml";
const source = await readFile(workflowPath, "utf8");
const errors = [];

const requireText = (pattern, message) => {
  if (!pattern.test(source)) errors.push(message);
};

requireText(/^on:\s*$/m, "Workflow phải khai báo trigger.");
requireText(/^\s+pull_request:\s*$/m, "Workflow phải chạy trên pull request.");
requireText(/^\s+push:\s*$/m, "Workflow phải chạy trên push.");
requireText(/^concurrency:\s*$/m, "Workflow phải có concurrency.");
requireText(/^\s+cancel-in-progress:\s+true\s*$/m, "Workflow phải hủy revision cũ.");
requireText(/^permissions:\s*\n\s+contents:\s+read\s*$/m, "Quyền mặc định phải chỉ đọc nội dung.");
requireText(/pnpm install --frozen-lockfile/, "Thiếu frozen install.");
requireText(/pnpm lint/, "Thiếu lint.");
requireText(/pnpm typecheck/, "Thiếu typecheck.");
requireText(/pnpm test(?:\s|$)/, "Thiếu unit tests.");
requireText(/pnpm build/, "Thiếu build.");
requireText(/supabase db reset/, "Thiếu Supabase database reset.");
requireText(/supabase db lint --level warning/, "Thiếu database lint.");
requireText(/supabase test db/, "Thiếu pgTAP.");
requireText(/pnpm test:auth/, "Thiếu Auth integration.");
requireText(/pnpm (?:test:e2e|--filter @quan-ly-vay-ca-nhan\/web exec playwright test)/, "Thiếu Playwright E2E.");
requireText(/^\s+fail-fast:\s+false\s*$/m, "E2E matrix phải chạy đủ shard khi một shard thất bại.");
requireText(/^\s+shard:\s+\[1, 2\]\s*$/m, "E2E phải chia đúng hai shard để giữ budget 45 phút.");
requireText(/pnpm --filter @quan-ly-vay-ca-nhan\/web exec playwright test --shard="\$\{\{ matrix\.shard \}\}\/2"/, "Playwright E2E phải chạy đủ hai shard.");
requireText(/pnpm audit --audit-level high/, "Thiếu dependency audit fail-closed.");
requireText(/ghcr\.io\/gitleaks\/gitleaks:v8\.30\.1@sha256:[0-9a-f]{64}/, "Gitleaks image phải pin bằng digest.");
requireText(/rhysd\/actionlint:1\.7\.9@sha256:[0-9a-f]{64}/, "Actionlint image phải pin bằng digest.");
requireText(
  /supabase\/setup-cli@45a513f8c64c0bc8e0e3dfe572b5c95be85f6359/,
  "Supabase setup action phải pin v3.0.1 hỗ trợ Node.js 24.",
);
requireText(/^\s+gate:\s*$/m, "Thiếu job gate tổng hợp.");

if (/continue-on-error\s*:\s*true/i.test(source)) {
  errors.push("Không cho phép continue-on-error: true.");
}
if (/\b(?:PRODUCTION|PROD)_?(?:SECRET|KEY|TOKEN|PASSWORD)\b/i.test(source)) {
  errors.push("Workflow không được tham chiếu credential Production.");
}
if (/\bsecrets\./.test(source)) {
  errors.push("Workflow K04 không được phụ thuộc repository/environment secret.");
}

for (const match of source.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)) {
  const action = match[1];
  if (action.startsWith("./") || /^[^@]+@[0-9a-f]{40}$/.test(action)) continue;
  errors.push(`Action bên ngoài chưa pin SHA đầy đủ: ${action}`);
}

for (const [name, expected] of [
  ["NODE_VERSION", "24.15.0"],
  ["PNPM_VERSION", "11.9.0"],
  ["SUPABASE_VERSION", "2.109.0"],
  ["PLAYWRIGHT_VERSION", "1.62.1"],
]) {
  requireText(new RegExp(`^\\s+${name}:\\s+[\"']?${expected.replaceAll(".", "\\.")}[\"']?\\s*$`, "m"), `${name} phải pin ${expected}.`);
}

if (errors.length > 0) {
  for (const error of errors) console.error(`CI policy: ${error}`);
  process.exit(1);
}

console.log(`CI policy đạt: ${workflowPath}`);

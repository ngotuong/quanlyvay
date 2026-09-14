import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repositoryRoot = resolve(import.meta.dirname, "../../..");
const environmentFile = resolve(repositoryRoot, process.env.C35_ENV_FILE ?? ".vercel/.env.preview.local");

for (const line of readFileSync(environmentFile, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (!match || process.env[match[1]]) continue;
  const raw = match[2].trim();
  process.env[match[1]] = raw.startsWith('"') ? JSON.parse(raw) : raw;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!supabaseUrl?.includes("hmfxnstrqfqpvsgfmjmd") || !secretKey) {
  throw new Error("C35 remote account audit requires the expected shared Supabase environment.");
}

const admin = createClient(supabaseUrl, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
const required = async (promise, label) => {
  const result = await promise;
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data ?? [];
};

const profiles = await required(
  admin.from("profiles").select("user_id,username,role,is_active").order("username"),
  "profiles",
);
const technicalProfiles = profiles.filter((profile) => profile.role !== "OWNER");
const references = new Map(technicalProfiles.map((profile) => [profile.user_id, {}]));

for (const [table, columns] of [
  ["counterparties", ["created_by", "updated_by"]],
  ["loans", ["created_by", "updated_by"]],
  ["transactions", ["created_by"]],
  ["loan_lifecycle_events", ["created_by"]],
  ["loan_term_corrections", ["created_by"]],
  ["loan_settlement_reversals", ["created_by"]],
  ["legacy_loan_onboardings", ["created_by"]],
]) {
  const rows = await required(admin.from(table).select(columns.join(",")), table);
  for (const row of rows) {
    for (const column of columns) {
      const userId = row[column];
      if (!userId || !references.has(userId)) continue;
      const counts = references.get(userId);
      const key = `${table}.${column}`;
      counts[key] = (counts[key] ?? 0) + 1;
    }
  }
}

const authUsers = [];
for (let page = 1; ; page += 1) {
  const result = await admin.auth.admin.listUsers({ page, perPage: 100 });
  if (result.error) throw new Error(`auth users: ${result.error.message}`);
  authUsers.push(...result.data.users);
  if (result.data.users.length < 100) break;
}
const authById = new Map(authUsers.map((user) => [user.id, user]));

const report = technicalProfiles.map((profile) => {
  const breakdown = references.get(profile.user_id);
  const authUser = authById.get(profile.user_id);
  return {
    username: profile.username,
    active: profile.is_active,
    authPresent: Boolean(authUser),
    banned: Boolean(authUser?.banned_until && new Date(authUser.banned_until) > new Date()),
    protectedReferenceCount: Object.values(breakdown).reduce((sum, value) => sum + value, 0),
    protectedReferences: breakdown,
  };
});

console.log(JSON.stringify({ ownerCount: profiles.length - technicalProfiles.length, technicalCount: report.length, accounts: report }, null, 2));

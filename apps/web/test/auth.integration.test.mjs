import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(webRoot, "../..");
const databaseContainer = "supabase_db_QuanLyVayCaNhan";
const kongContainer = "supabase_kong_QuanLyVayCaNhan";

function cliWorks() {
  return spawnSync("supabase", ["status", "-o", "env"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).status === 0;
}

function cleanLocalDatabase() {
  execFileSync("docker", [
    "exec", databaseContainer, "psql", "-U", "postgres", "-d", "postgres",
    "-v", "ON_ERROR_STOP=1", "-c",
    [
      "truncate table public.audit_logs, public.push_subscriptions, public.notifications,",
      "public.expenses, public.interest_periods, public.loan_lifecycle_events,",
      "public.transactions, public.loans, public.counterparties, public.profiles",
      "restart identity cascade; delete from auth.users;",
    ].join(" "),
  ], { cwd: repositoryRoot, stdio: "inherit" });
}

function localSupabaseEnvironment() {
  if (!cliWorks()) {
    const kongConfig = execFileSync("docker", ["exec", kongContainer, "cat", "/home/kong/kong.yml"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const publishableKey = kongConfig.match(/headers\.apikey == '(sb_publishable_[^']+)'/)?.[1];
    const secretKey = kongConfig.match(/headers\.apikey == '(sb_secret_[^']+)'/)?.[1];
    return { API_URL: "http://127.0.0.1:54321", PUBLISHABLE_KEY: publishableKey, SECRET_KEY: secretKey };
  }
  const output = execFileSync("supabase", ["status", "-o", "env"], {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return Object.fromEntries(
    output
      .split("\n")
      .map((line) => line.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((match) => [match[1], match[2]]),
  );
}

const environment = localSupabaseEnvironment();
const apiUrl = environment.API_URL;
const publishableKey = environment.PUBLISHABLE_KEY || environment.ANON_KEY;
const secretKey = environment.SECRET_KEY || environment.SERVICE_ROLE_KEY;

assert.ok(apiUrl, "Supabase local API chưa chạy.");
assert.ok(publishableKey, "Không lấy được local publishable key.");
assert.ok(secretKey, "Không lấy được local secret key.");

const admin = createClient(apiUrl, secretKey, {
  auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
});

const ownerCredentials = {
  username: "c5_owner_test",
  email: "c5_owner_test@auth.local",
  password: "OwnerLocal123",
};
const viewerCredentials = {
  username: "c5_viewer_test",
  email: "c5_viewer_test@auth.local",
  password: "ViewerLocal123",
};

async function provisionUser(credentials, displayName, role) {
  const { data, error } = await admin.auth.admin.createUser({
    email: credentials.email,
    password: credentials.password,
    email_confirm: true,
    user_metadata: {
      provisioned_by_app: "true",
      username: credentials.username,
      display_name: displayName,
      app_role: role,
    },
  });

  assert.ifError(error);
  assert.ok(data.user);
  return data.user;
}

test("local Auth session and application roles", async (t) => {
  cleanLocalDatabase();
  t.after(cleanLocalDatabase);
  const { count, error: countError } = await admin
    .from("profiles")
    .select("*", { count: "exact", head: true });
  assert.ifError(countError);
  assert.equal(count, 0, "Chạy `supabase db reset` trước test:auth để dùng database test sạch.");

  const anonymous = createClient(apiUrl, publishableKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
  });

  await t.test("public signup remains disabled", async () => {
    const { error } = await anonymous.auth.signUp({
      email: "public_signup@auth.local",
      password: "PublicSignup123",
    });
    assert.ok(error);
  });

  const owner = await provisionUser(ownerCredentials, "C5 Owner Test", "VIEWER");
  const viewer = await provisionUser(viewerCredentials, "C5 Viewer Test", "VIEWER");

  await t.test("first user becomes owner and password login creates a session", async () => {
    const ownerClient = createClient(apiUrl, publishableKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    const { data, error } = await ownerClient.auth.signInWithPassword({
      email: ownerCredentials.email,
      password: ownerCredentials.password,
    });
    assert.ifError(error);
    assert.equal(data.user.id, owner.id);
    assert.ok(data.session.access_token);

    const { data: profile, error: profileError } = await ownerClient
      .from("profiles")
      .select("username, role, must_change_password, is_active")
      .eq("user_id", owner.id)
      .single();
    assert.ifError(profileError);
    assert.deepEqual(profile, {
      username: ownerCredentials.username,
      role: "OWNER",
      must_change_password: true,
      is_active: true,
    });
  });

  await t.test("wrong password does not create a session", async () => {
    const client = createClient(apiUrl, publishableKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    const { data, error } = await client.auth.signInWithPassword({
      email: ownerCredentials.email,
      password: "WrongPassword123",
    });
    assert.ok(error);
    assert.equal(data.session, null);
  });

  await t.test("deactivated viewer keeps no application data access", async () => {
    const ownerClient = createClient(apiUrl, publishableKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    const viewerClient = createClient(apiUrl, publishableKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });

    assert.ifError(
      (
        await ownerClient.auth.signInWithPassword({
          email: ownerCredentials.email,
          password: ownerCredentials.password,
        })
      ).error,
    );
    assert.ifError(
      (
        await viewerClient.auth.signInWithPassword({
          email: viewerCredentials.email,
          password: viewerCredentials.password,
        })
      ).error,
    );

    const { error: manageError } = await ownerClient.rpc("manage_profile", {
      p_user_id: viewer.id,
      p_display_name: "C5 Viewer Test",
      p_role: "VIEWER",
      p_is_active: false,
    });
    assert.ifError(manageError);

    const { error: inactiveRpcError } = await viewerClient.rpc("complete_password_change");
    assert.equal(inactiveRpcError?.code, "42501");

    const { data: counterparties, error: readError } = await viewerClient
      .from("counterparties")
      .select("id");
    assert.ifError(readError);
    assert.deepEqual(counterparties, []);
  });

  await t.test("owner can complete first-login change with a six-digit password", async () => {
    const ownerClient = createClient(apiUrl, publishableKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });
    assert.ifError((await ownerClient.auth.signInWithPassword({
      email: ownerCredentials.email,
      password: ownerCredentials.password,
    })).error);
    assert.ifError((await ownerClient.auth.updateUser({ password: "123456" })).error);
    assert.ifError((await ownerClient.rpc("complete_password_change")).error);

    const { data: profile, error: profileError } = await ownerClient
      .from("profiles")
      .select("must_change_password")
      .eq("user_id", owner.id)
      .single();
    assert.ifError(profileError);
    assert.equal(profile.must_change_password, false);

    await ownerClient.auth.signOut();
    const { data: login, error: loginError } = await ownerClient.auth.signInWithPassword({
      email: ownerCredentials.email,
      password: "123456",
    });
    assert.ifError(loginError);
    assert.equal(login.user.id, owner.id);
  });
});

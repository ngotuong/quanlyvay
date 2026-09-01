import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const script = new URL("./backup-sql-gate.mjs", import.meta.url).pathname;

function run(mode, input) {
  return spawnSync(process.execPath, [script, mode], { input, encoding: "utf8" });
}

test("backup SQL gate accepts pg_dump schema and data shapes", () => {
  const schema = run("schema", "SET statement_timeout = 0;\nCREATE SCHEMA public;\n");
  const data = run("data", "SET statement_timeout = 0;\nCOPY public.loans (id) FROM stdin;\n\\.\n");
  assert.equal(schema.status, 0, schema.stderr);
  assert.equal(data.status, 0, data.stderr);
});

test("backup SQL gate rejects a telemetry error appended to valid SQL", () => {
  const result = run(
    "schema",
    'SET statement_timeout = 0;\nCREATE SCHEMA public;\n{"_tag":"Error","error":{"message":"Timeout while shutting down PostHog."}}\n',
  );
  assert.equal(result.status, 1);
  assert.match(result.stderr, /CLI error payload/);
});

test("backup SQL gate rejects truncated or wrong backup shapes", () => {
  assert.equal(run("schema", "CREATE SCHEMA public;\n").status, 1);
  assert.equal(run("data", "SET statement_timeout = 0;\n").status, 1);
});

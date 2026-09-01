#!/usr/bin/env node

const mode = process.argv[2];
if (!new Set(["schema", "data"]).has(mode)) {
  process.stderr.write("Usage: backup-sql-gate.mjs <schema|data>\n");
  process.exit(2);
}

let sql = "";
for await (const chunk of process.stdin) sql += chunk;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

if (!sql.trim()) fail("Backup SQL is empty.");
if (/^\s*\{.*"_tag"\s*:\s*"Error"/m.test(sql) || /Timeout while shutting down PostHog/.test(sql)) {
  fail("Backup SQL contains a Supabase CLI error payload.");
}
if (sql.includes("\0")) fail("Backup SQL contains a NUL byte.");

if (mode === "schema") {
  if (!/^SET statement_timeout = 0;$/m.test(sql)) fail("Schema dump is missing the pg_dump preamble.");
  if (!/^CREATE SCHEMA /m.test(sql)) fail("Schema dump contains no schema definition.");
} else {
  if (!/^SET statement_timeout = 0;$/m.test(sql)) fail("Data dump is missing the pg_dump preamble.");
  if (!/^COPY /m.test(sql)) fail("Data dump contains no COPY payload.");
}

process.stdout.write(`${mode.toUpperCase()}_SQL_OK\n`);

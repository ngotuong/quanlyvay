#!/usr/bin/env node

import { createCipheriv, createDecipheriv } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { once } from "node:events";

const MAGIC = Buffer.from("QLVBAK01", "ascii");
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function readKey() {
  const encoded = process.env.QLV_BACKUP_KEY_BASE64;
  if (!encoded) fail("QLV_BACKUP_KEY_BASE64 is required");

  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) fail("QLV_BACKUP_KEY_BASE64 must decode to exactly 32 bytes");
  return key;
}

async function writeChunk(output, chunk) {
  if (!output.write(chunk)) await once(output, "drain");
}

async function finishOutput(output, outputPath) {
  if (outputPath === "-") return;
  output.end();
  await once(output, "close");
}

async function encrypt(inputPath, outputPath) {
  const { randomBytes } = await import("node:crypto");
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", readKey(), iv);
  const input = inputPath === "-" ? process.stdin : createReadStream(inputPath);
  const output = outputPath === "-" ? process.stdout : createWriteStream(outputPath, { mode: 0o600 });

  await writeChunk(output, Buffer.concat([MAGIC, iv]));
  for await (const chunk of input) await writeChunk(output, cipher.update(chunk));
  await writeChunk(output, cipher.final());
  await writeChunk(output, cipher.getAuthTag());
  await finishOutput(output, outputPath);
}

async function decrypt(inputPath, outputPath) {
  const input = inputPath === "-" ? process.stdin : createReadStream(inputPath);
  const output = outputPath === "-" ? process.stdout : createWriteStream(outputPath, { mode: 0o600 });
  let header = Buffer.alloc(0);
  let tail = Buffer.alloc(0);
  let decipher;

  for await (const chunk of input) {
    if (!decipher) {
      header = Buffer.concat([header, chunk]);
      if (header.length < MAGIC.length + IV_LENGTH) continue;
      if (!header.subarray(0, MAGIC.length).equals(MAGIC)) fail("Invalid backup format");
      const iv = header.subarray(MAGIC.length, MAGIC.length + IV_LENGTH);
      decipher = createDecipheriv("aes-256-gcm", readKey(), iv);
      tail = header.subarray(MAGIC.length + IV_LENGTH);
    } else {
      tail = Buffer.concat([tail, chunk]);
    }

    if (tail.length > TAG_LENGTH) {
      const boundary = tail.length - TAG_LENGTH;
      await writeChunk(output, decipher.update(tail.subarray(0, boundary)));
      tail = tail.subarray(boundary);
    }
  }

  if (!decipher || tail.length !== TAG_LENGTH) fail("Truncated backup");
  decipher.setAuthTag(tail);
  await writeChunk(output, decipher.final());
  await finishOutput(output, outputPath);
}

const [mode, inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath || !["encrypt", "decrypt"].includes(mode)) {
  fail("Usage: backup-crypto.mjs <encrypt|decrypt> <input> <output>");
}

await (mode === "encrypt" ? encrypt(inputPath, outputPath) : decrypt(inputPath, outputPath));

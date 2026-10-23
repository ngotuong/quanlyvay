import { lookup as dnsLookup } from "node:dns/promises";
import { Agent } from "node:https";
import { BlockList, isIP } from "node:net";

const defaultAllowedHostPatterns = Object.freeze([
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "updates.push.services.mozilla.com",
  "*.push.apple.com",
]);

const blockedIpv4 = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
]) {
  blockedIpv4.addSubnet(network, prefix, "ipv4");
}

const globalIpv6 = new BlockList();
globalIpv6.addSubnet("2000::", 3, "ipv6");

const blockedIpv6 = new BlockList();
for (const [network, prefix] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
]) {
  blockedIpv6.addSubnet(network, prefix, "ipv6");
}

function normalizedHostPattern(rawPattern) {
  const pattern = rawPattern.trim().toLowerCase();
  const hostname = pattern.startsWith("*.") ? pattern.slice(2) : pattern;
  if (!hostname || hostname.endsWith(".") || isIP(hostname) !== 0 || hostname.includes("*")) {
    throw new Error("Invalid Web Push provider hostname policy");
  }
  const parsed = new URL(`https://${hostname}`);
  if (parsed.hostname !== hostname || parsed.pathname !== "/") {
    throw new Error("Invalid Web Push provider hostname policy");
  }
  return pattern.startsWith("*.") ? `*.${hostname}` : hostname;
}

export function allowedPushHostPatterns(configured = process.env.WEB_PUSH_ALLOWED_HOSTS) {
  if (!configured?.trim()) return defaultAllowedHostPatterns;
  const additions = configured.split(",").map(normalizedHostPattern);
  return Object.freeze([...new Set([...defaultAllowedHostPatterns, ...additions])]);
}

export function isAllowedPushHostname(hostname, patterns = allowedPushHostPatterns()) {
  const normalized = hostname.toLowerCase();
  if (!normalized || normalized.endsWith(".") || isIP(normalized) !== 0) return false;
  return patterns.some(pattern => pattern.startsWith("*.")
    ? normalized.endsWith(pattern.slice(1)) && normalized.length > pattern.length - 1
    : normalized === pattern);
}

export function parseAllowedPushEndpoint(value, patterns = allowedPushHostPatterns()) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) return null;
    if (!isAllowedPushHostname(url.hostname, patterns)) return null;
    return url;
  } catch {
    return null;
  }
}

export function isPublicPushAddress(address, family = isIP(address)) {
  if (family === 4) return !blockedIpv4.check(address, "ipv4");
  if (family === 6) {
    return globalIpv6.check(address, "ipv6") && !blockedIpv6.check(address, "ipv6");
  }
  return false;
}

function normalizedResolution(entry) {
  const family = typeof entry.family === "string"
    ? Number(entry.family.replace("IPv", ""))
    : entry.family;
  if ((family !== 4 && family !== 6) || isIP(entry.address) !== family) {
    throw new Error("Push endpoint DNS returned an invalid address");
  }
  return { address: entry.address, family };
}

export function createPinnedLookup(expectedHostname, selected) {
  return (hostname, options, callback) => {
    const normalized = hostname.toLowerCase();
    if (normalized !== expectedHostname) {
      callback(new Error("Push endpoint hostname changed after validation"));
      return;
    }
    if (typeof options === "object" && options?.all) {
      callback(null, [selected]);
      return;
    }
    callback(null, selected.address, selected.family);
  };
}

export async function createPinnedPushAgent(
  endpoint,
  { lookup = dnsLookup, patterns = allowedPushHostPatterns(), timeoutMs = 5_000 } = {},
) {
  const url = parseAllowedPushEndpoint(endpoint, patterns);
  if (!url) throw Object.assign(new Error("Push endpoint rejected by provider policy"), { statusCode: 400 });

  let timeout;
  const dnsTimeout = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(Object.assign(new Error("Push endpoint DNS timeout"), { statusCode: 408 })), timeoutMs);
    timeout.unref?.();
  });
  let answers;
  try {
    answers = await Promise.race([
      lookup(url.hostname, { all: true, verbatim: true }),
      dnsTimeout,
    ]);
  } finally {
    clearTimeout(timeout);
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    throw Object.assign(new Error("Push endpoint DNS returned no address"), { statusCode: 400 });
  }
  const normalized = answers.map(normalizedResolution);
  if (normalized.some(({ address, family }) => !isPublicPushAddress(address, family))) {
    throw Object.assign(new Error("Push endpoint DNS returned a non-public address"), { statusCode: 400 });
  }

  const selected = normalized[0];
  const pinnedLookup = createPinnedLookup(url.hostname, selected);
  return {
    agent: new Agent({ keepAlive: false, lookup: pinnedLookup }),
    hostname: url.hostname,
    address: selected.address,
    family: selected.family,
    lookup: pinnedLookup,
  };
}

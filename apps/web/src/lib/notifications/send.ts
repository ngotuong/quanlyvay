import "server-only";
import webpush from "web-push";
import { createPinnedPushAgent } from "./push-endpoint.mjs";

export function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_PRIVATE_KEY?.trim();
  if (!publicKey || !privateKey) throw new Error("Push is not configured");
  webpush.setVapidDetails(process.env.WEB_PUSH_SUBJECT?.trim() || "mailto:admin@example.invalid", publicKey, privateKey);
}

export async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth_secret: string }, payload: unknown) {
  const { agent } = await createPinnedPushAgent(subscription.endpoint, { timeoutMs: 5000 });
  try {
    await webpush.sendNotification({ endpoint: subscription.endpoint,
      keys: { p256dh: subscription.p256dh, auth: subscription.auth_secret } }, JSON.stringify(payload),
    { timeout: 5000, agent, TTL: 86400, urgency: "high" });
  } finally { agent.destroy(); }
}

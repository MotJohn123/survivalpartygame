import webpush from "web-push";
import { prisma } from "@/lib/prisma";

function getWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  const validKey = (value: string | undefined) => Boolean(value && /^[A-Za-z0-9_-]+$/.test(value));
  if (!publicKey || !privateKey || !subject || !validKey(publicKey) || !validKey(privateKey)) return null;
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    return webpush;
  } catch {
    return null;
  }
}

export async function notifyPlayers(title: string, body: string) {
  const client = getWebPush();
  if (!client) return;
  const subscriptions = await prisma.pushSubscription.findMany();
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await client.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title, body }));
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "statusCode" in error && error.statusCode === 404) await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } });
    }
  }));
}

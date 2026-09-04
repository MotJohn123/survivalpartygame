import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const configured = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT!, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);

export async function notifyPlayers(title: string, body: string) {
  if (!configured) return;
  const subscriptions = await prisma.pushSubscription.findMany();
  await Promise.all(subscriptions.map(async (subscription) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify({ title, body }));
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && "statusCode" in error && error.statusCode === 404) await prisma.pushSubscription.delete({ where: { endpoint: subscription.endpoint } });
    }
  }));
}

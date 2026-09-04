"use client";

import { useState } from "react";

export default function NotificationButton() {
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [status, setStatus] = useState("");
  if (!supported || typeof Notification === "undefined" || Notification.permission === "granted") return null;
  async function enable() {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { setStatus("Oznámení nebyla povolena."); return; }
    const registration = await navigator.serviceWorker.ready;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) { setStatus("Oznámení zatím nejsou nakonfigurována."); return; }
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey });
    const response = await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
    setStatus(response.ok ? "Oznámení jsou povolena." : "Subscription se nepodařilo uložit.");
  }
  return <button className="notification-button" type="button" onClick={() => void enable()}>♢ Povolit oznámení{status && <small>{status}</small>}</button>;
}

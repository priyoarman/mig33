"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaBell, FaBellSlash } from "react-icons/fa";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationToggle() {
  const { status } = useSession();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const isSupported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(isSupported);
    if (!isSupported) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setSubscribed(!!subscription))
      .catch(() => {});
  }, [status]);

  const subscribe = async () => {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription.toJSON()),
    });
    setSubscribed(true);
  };

  const unsubscribe = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      setSubscribed(false);
      return;
    }
    await subscription.unsubscribe();
    await fetch("/api/notifications/unsubscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    setSubscribed(false);
  };

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (subscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (error) {
      console.error("Push notification toggle failed:", error);
    } finally {
      setBusy(false);
    }
  };

  if (status !== "authenticated" || !supported) return null;

  return (
    <div className="border-default flex w-full items-center justify-center gap-1 border-b px-2 py-2 text-center text-[16px] font-bold">
      <button
        onClick={toggle}
        disabled={busy}
        aria-label="Toggle push notifications"
        className="flex cursor-pointer items-center gap-2 disabled:opacity-50"
        style={{ background: "transparent", color: "var(--text)" }}
      >
        <span className="hidden font-medium sm:flex">Push:</span>
        {subscribed ? <FaBell size={18} /> : <FaBellSlash size={18} />}
      </button>
    </div>
  );
}

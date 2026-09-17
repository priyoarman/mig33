"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaBell, FaBellSlash } from "react-icons/fa";
import {
  getExistingSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push-client";

export default function PushNotificationToggle() {
  const { status } = useSession();
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status !== "authenticated") return;
    const isSupported = isPushSupported();
    setSupported(isSupported);
    if (!isSupported) return;

    getExistingSubscription()
      .then((subscription) => setSubscribed(!!subscription))
      .catch(() => {});
  }, [status]);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        const success = await subscribeToPush();
        setSubscribed(success);
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

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getExistingSubscription,
  isPushSupported,
  isStandalone,
  subscribeToPush,
  syncExistingSubscription,
} from "@/lib/push-client";

const DISMISS_KEY = "push-permission-prompt-dismissed";

export default function PushPermissionPrompt() {
  const pathname = usePathname();
  const { status } = useSession();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  // Show right after the first standalone launch — logged in or not — since
  // that's the moment a user has just finished adding the app to their home
  // screen. Only permission gating (not auth) decides whether to ask.
  useEffect(() => {
    if (pathname === "/install") return;
    if (status === "loading") return;
    if (!isPushSupported() || !isStandalone()) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(DISMISS_KEY) === "true") return;

    getExistingSubscription()
      .then((subscription) => {
        if (!subscription) setVisible(true);
      })
      .catch(() => {});
  }, [pathname, status]);

  // A subscription created while logged out has no owner on the backend yet
  // (the subscribe endpoint requires a session). Once a session shows up,
  // bind whatever subscription already exists on this device to it.
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isPushSupported() || !isStandalone()) return;
    syncExistingSubscription().catch(() => {});
  }, [status]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      await subscribeToPush();
    } catch (error) {
      console.error("Push subscribe failed:", error);
    } finally {
      // Whichever way the native prompt was answered, the browser has now
      // recorded a permanent decision (or the user declined ours) — don't
      // keep asking on every launch.
      localStorage.setItem(DISMISS_KEY, "true");
      setBusy(false);
      setVisible(false);
    }
  };

  return (
    <div
      className="bg-panel border-default text-primary fixed inset-x-4 z-50 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      <span>Turn on notifications for new messages and activity?</span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={dismiss}
          className="hover-panel rounded-full px-3 py-1 font-medium"
        >
          Not now
        </button>
        <button
          onClick={enable}
          disabled={busy}
          className="bg-accent text-on-accent rounded-full px-3 py-1 font-bold disabled:opacity-50"
        >
          Enable
        </button>
      </div>
    </div>
  );
}

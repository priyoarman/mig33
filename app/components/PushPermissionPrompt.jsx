"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getExistingSubscription,
  isPushSupported,
  isStandalone,
  subscribeToPush,
  syncExistingSubscription,
} from "@/lib/push-client";

// Session-scoped, not persistent: "Not now" should only quiet the prompt for
// the current app open, not forever — the next time the installed app is
// launched, it should ask again (until permission is actually granted or
// denied, which Notification.permission tracks on its own).
const DISMISS_KEY = "push-permission-prompt-dismissed";

// Persistent: set once a subscribe attempt actually succeeds. Distinguishes
// "revoked after previously working" (worth re-surfacing, since the user
// clearly wanted this on) from "declined the very first native prompt"
// (browsers won't let JS re-trigger that dialog anyway, so nagging forever
// would just be a dead button).
const ENABLED_BEFORE_KEY = "push-notifications-enabled-before";

export default function PushPermissionPrompt() {
  const pathname = usePathname();
  const { status } = useSession();
  const [visible, setVisible] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [busy, setBusy] = useState(false);

  // Show right after the first standalone launch — logged in or not — since
  // that's the moment a user has just finished adding the app to their home
  // screen. Only permission gating (not auth) decides whether to ask.
  useEffect(() => {
    if (pathname === "/install") return;
    if (status === "loading") return;
    if (!isPushSupported() || !isStandalone()) return;
    if (sessionStorage.getItem(DISMISS_KEY) === "true") return;

    const permission = Notification.permission;

    if (permission === "granted") return;

    if (permission === "denied") {
      // Only re-surface a denial if it was granted before and later revoked
      // (e.g. in system/browser settings) elsewhere — a fresh first-time
      // "no" can't be re-prompted by the browser, so there's nothing to do.
      if (localStorage.getItem(ENABLED_BEFORE_KEY) === "true") {
        setRevoked(true);
        setVisible(true);
      }
      return;
    }

    getExistingSubscription()
      .then((subscription) => {
        if (!subscription) {
          setRevoked(false);
          setVisible(true);
        }
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
    sessionStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  const enable = async () => {
    setBusy(true);
    try {
      const subscribed = await subscribeToPush();
      if (subscribed) localStorage.setItem(ENABLED_BEFORE_KEY, "true");
    } catch (error) {
      console.error("Push subscribe failed:", error);
    } finally {
      // Whichever way the native prompt was answered, this just quiets the
      // banner for the rest of the current session — the effect above
      // decides on the next app open whether it's still worth asking.
      sessionStorage.setItem(DISMISS_KEY, "true");
      setBusy(false);
      setVisible(false);
    }
  };

  // Rendered via a portal straight onto <body> and given the highest
  // reasonable z-index so it always sits above the sticky mobile top bar
  // (and everything else in the app shell), regardless of which stacking
  // context it's mounted under in the component tree.
  return createPortal(
    <div className="bg-panel border-default text-primary fixed inset-x-0 top-0 z-[9999] flex h-14 items-center justify-between gap-3 border-b px-4 text-sm shadow-lg">
      <span>
        {revoked
          ? "Notifications got turned off. Re-enable them in your browser or phone settings to keep getting alerts."
          : "Turn on notifications for new messages and activity?"}
      </span>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={dismiss}
          className="hover-panel rounded-full px-3 py-1 font-medium"
        >
          {revoked ? "Got it" : "Not now"}
        </button>
        {!revoked && (
          <button
            onClick={enable}
            disabled={busy}
            className="bg-accent text-on-accent rounded-full px-3 py-1 font-bold disabled:opacity-50"
          >
            Enable
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}

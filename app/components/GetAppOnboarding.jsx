"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  IoShareOutline,
  IoAddCircleOutline,
  IoEllipsisVertical,
  IoCheckmarkCircle,
  IoDownloadOutline,
  IoPhonePortraitOutline,
  IoCopyOutline,
} from "react-icons/io5";
import { isStandalone } from "@/lib/push-client";

function detectPlatform(ua) {
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

function detectInAppBrowser(ua) {
  const knownApps =
    /FBAN|FBAV|FB_IAB|Instagram|Line\/|WhatsApp\/|TikTok|musical_ly|Snapchat|LinkedInApp|Twitter/i;
  if (knownApps.test(ua)) return true;

  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isRealSafari =
    /safari/i.test(ua) &&
    !/crios|fxios|edgios|opios/i.test(ua);
  const isKnownIosBrowser = /crios|fxios|edgios|opios/i.test(ua);

  if (isIos && !isRealSafari && !isKnownIosBrowser) return true;
  if (isAndroid && /; wv\)/i.test(ua)) return true;

  return false;
}

export default function GetAppOnboarding() {
  const { status } = useSession();
  const [state, setState] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [justInstalled, setJustInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    setState({
      platform: detectPlatform(ua),
      inApp: detectInAppBrowser(ua),
      standalone: isStandalone(),
    });

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => setJustInstalled(true);

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  // This is a full-screen takeover — lock background scroll so the page
  // behind it (and its own content) can't be dragged around on mobile.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the visible link text is the fallback.
    }
  };

  const promptInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  const Shell = ({ children }) => (
    <div className="bg-app fixed inset-0 z-50 flex w-full flex-col items-center justify-center px-6">
      <div className="bg-panel border-default max-h-full w-full max-w-md overflow-y-auto rounded-2xl border p-6 text-center">
        <div className="mb-4 flex justify-center">
          <Image
            src="/icon-192.png"
            alt="mig33"
            width={64}
            height={64}
            className="rounded-2xl"
          />
        </div>
        <h1 className="text-primary mb-1 text-xl font-bold">
          Get mig33 on your phone
        </h1>
        {children}
      </div>
    </div>
  );

  // Avoid rendering platform-specific UI before the client-only checks run.
  if (!state) return <Shell />;

  if (state.inApp) {
    return (
      <Shell>
        <p className="text-muted mb-5 text-sm">
          You opened this link inside another app, which blocks installing
          mig33 to your home screen. Open it in your regular browser first.
        </p>
        <ol className="text-primary mb-5 space-y-3 text-left text-sm">
          <li className="flex items-start gap-3">
            <IoEllipsisVertical className="mt-0.5 shrink-0 text-lg" />
            <span>
              Tap the menu (••• or the share icon) in the top or bottom bar
            </span>
          </li>
          <li className="flex items-start gap-3">
            <IoShareOutline className="mt-0.5 shrink-0 text-lg" />
            <span>
              Choose &quot;Open in Browser&quot; (Safari or Chrome)
            </span>
          </li>
        </ol>
        <button
          onClick={copyLink}
          className="hover-panel border-default text-primary flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium"
        >
          <IoCopyOutline />
          {copied ? "Link copied!" : "Or copy this link instead"}
        </button>
      </Shell>
    );
  }

  if (state.standalone) {
    return (
      <Shell>
        <p className="text-muted mb-5 text-sm">
          You&apos;re already using mig33 as an app on this device.
          {status !== "authenticated" &&
            " Log in and we'll ask if you want notifications turned on."}
        </p>
        <Link
          href={status === "authenticated" ? "/" : "/login"}
          className="bg-accent text-on-accent flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
        >
          <IoCheckmarkCircle />
          {status === "authenticated" ? "Go to your feed" : "Log in to continue"}
        </Link>
      </Shell>
    );
  }

  if (justInstalled) {
    return (
      <Shell>
        <p className="text-muted mb-2 text-sm">
          mig33 is installed. Open it from your home screen to finish
          setting up.
        </p>
        <p className="text-muted flex items-center justify-center gap-2 text-xs">
          <IoPhonePortraitOutline /> Look for the mig33 icon you just added
        </p>
      </Shell>
    );
  }

  if (deferredPrompt) {
    return (
      <Shell>
        <p className="text-muted mb-5 text-sm">
          Install mig33 as an app for a faster experience and push
          notifications.
        </p>
        <button
          onClick={promptInstall}
          className="bg-accent text-on-accent flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
        >
          <IoDownloadOutline />
          Install App
        </button>
      </Shell>
    );
  }

  if (state.platform === "ios") {
    return (
      <Shell>
        <p className="text-muted mb-5 text-sm">
          Add mig33 to your home screen to open it like an app and receive
          notifications.
        </p>
        <ol className="text-primary mb-2 space-y-3 text-left text-sm">
          <li className="flex items-start gap-3">
            <IoShareOutline className="mt-0.5 shrink-0 text-lg" />
            <span>
              Tap the <strong>Share</strong> button in Safari&apos;s toolbar
            </span>
          </li>
          <li className="flex items-start gap-3">
            <IoAddCircleOutline className="mt-0.5 shrink-0 text-lg" />
            <span>
              Scroll down and tap <strong>Add to Home Screen</strong>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <IoCheckmarkCircle className="mt-0.5 shrink-0 text-lg" />
            <span>
              Tap <strong>Add</strong>, then open mig33 from your home screen
            </span>
          </li>
        </ol>
      </Shell>
    );
  }

  if (state.platform === "android") {
    return (
      <Shell>
        <p className="text-muted mb-5 text-sm">
          Add mig33 to your home screen to open it like an app and receive
          notifications.
        </p>
        <ol className="text-primary mb-2 space-y-3 text-left text-sm">
          <li className="flex items-start gap-3">
            <IoEllipsisVertical className="mt-0.5 shrink-0 text-lg" />
            <span>
              Tap the menu (⋮) in the top-right corner of your browser
            </span>
          </li>
          <li className="flex items-start gap-3">
            <IoAddCircleOutline className="mt-0.5 shrink-0 text-lg" />
            <span>
              Tap <strong>Install app</strong> or{" "}
              <strong>Add to Home screen</strong>
            </span>
          </li>
        </ol>
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="text-muted mb-5 text-sm">
        mig33 works best as an app on your phone. Open this link on your
        mobile device to install it, or continue in your browser for now.
      </p>
      <Link
        href="/"
        className="hover-panel border-default text-primary flex w-full items-center justify-center rounded-full border px-4 py-2 text-sm font-medium"
      >
        Continue in browser
      </Link>
    </Shell>
  );
}

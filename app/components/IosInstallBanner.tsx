"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { IoClose } from "react-icons/io5";

const DISMISS_KEY = "ios-install-banner-dismissed";

// iOS Safari exposes this non-standard flag; the DOM lib doesn't know about it.
type NavigatorWithStandalone = Navigator & { standalone?: boolean };

export default function IosInstallBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as NavigatorWithStandalone).standalone === true;
    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";

    if (isIos && !isStandalone && !dismissed) {
      setVisible(true);
    }
  }, []);

  // The /install page already walks through this same instruction in detail.
  if (pathname === "/install") return null;
  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  return (
    <div className="bg-panel border-default text-primary mx-4 mt-3 flex items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm">
      <span>
        To receive live push notifications on iPhone, tap the Share button
        and select &quot;Add to Home Screen&quot;.
      </span>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="hover-panel shrink-0 cursor-pointer rounded-full p-1"
      >
        <IoClose />
      </button>
    </div>
  );
}

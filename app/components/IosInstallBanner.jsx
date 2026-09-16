"use client";

import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";

const DISMISS_KEY = "ios-install-banner-dismissed";

export default function IosInstallBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    const dismissed = localStorage.getItem(DISMISS_KEY) === "true";

    if (isIos && !isStandalone && !dismissed) {
      setVisible(true);
    }
  }, []);

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
        className="hover-panel shrink-0 rounded-full p-1"
      >
        <IoClose />
      </button>
    </div>
  );
}

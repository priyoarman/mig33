"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import MiniProfile from "./MiniProfile";
import ThemeToggle from "./ThemeToggle";

export default function MobileTopBar() {
  const { status } = useSession();
  const profileHref = status === "authenticated" ? "/profile" : "/login";

  return (
    <header className="border-default bg-panel sticky top-0 z-40 border-b sm:hidden">
      <div className="relative flex h-14 items-center justify-between px-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full text-xl transition hover:bg-neutral-200 dark:hover:bg-neutral-800">
          <ThemeToggle />
        </div>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2">
          <Image
            src="/mig33.png"
            alt="mig33"
            width={28}
            height={28}
            className="h-8 w-8 animate-[spin_5s] object-contain [animation-iteration-count:infinite]"
          />
        </Link>

        <Link href={profileHref} className="flex items-center justify-center">
          <MiniProfile compact />
        </Link>
      </div>
    </header>
  );
}

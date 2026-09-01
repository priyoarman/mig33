"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { BsThreeDots } from "react-icons/bs";
import { IoSettingsSharp } from "react-icons/io5";
import { IoLogOut } from "react-icons/io5";
import ThemeToggle from "./ThemeToggle";

const MiniProfile = ({ compact = false }) => {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  if (status === "loading") return null;

  if (compact) {
    return (
      <div className="avatar-square h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={32}
            height={32}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-600 text-sm font-bold text-white">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      {open && (
        <div className="bg-panel border-default absolute right-0 bottom-full z-50 mb-1 flex w-full flex-col overflow-hidden rounded-lg border shadow-lg">
          <div className="border-default flex w-full cursor-pointer items-center justify-center gap-1 border-b px-2 py-2 text-center text-[16px] font-bold">
            <ThemeToggle />
          </div>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="hover-panel text-primary flex w-full cursor-pointer items-center justify-center gap-1 py-2 text-center text-[16px] font-bold hover:text-red-500"
          >
            <IoLogOut /> Logout
          </button>
        </div>
      )}
      <div className="avatar-square h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
        {user?.image ? (
          <Image
            src={user.image}
            alt={user.name || "User"}
            width={40}
            height={40}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-neutral-600 font-bold text-white">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
        )}
      </div>

      {/* Name and Username */}
      <div className="flex min-w-0 flex-grow flex-col">
        <div className="text-primary truncate text-[16px] font-bold">
          {user?.name ?? "No User"}
        </div>
        <div className="text-muted truncate text-[14px] font-medium">
          @{user?.username ?? "nouser"}
        </div>
      </div>

      {/* Three Dots */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setOpen((o) => !o)}
          className="hover-panel flex cursor-pointer items-center justify-center rounded-full p-1"
          aria-label="Open profile menu"
        >
          <BsThreeDots />
        </button>
      </div>
    </div>
  );
};

export default MiniProfile;

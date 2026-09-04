"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { GoHomeFill } from "react-icons/go";
import { MdExplore } from "react-icons/md";
import { BsSearch } from "react-icons/bs";
import { FaBell } from "react-icons/fa";
import { FaEnvelope } from "react-icons/fa6";
import { FaUserCircle } from "react-icons/fa";
import MiniProfile from "./MiniProfile";
import { useRealtimeNotifications } from "./RealtimeProvider";

const LeftBar = () => {
  const { status } = useSession();
  const { unreadCount, messageUnreadCount } = useRealtimeNotifications();
  const profileHref = status === "authenticated" ? "/profile" : "/login";

  const navItems = [
    {
      href: "/",
      label: "Home",
      icon: (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
          <GoHomeFill className="text-2xl" />
        </span>
      ),
    },
    {
      href: "/search",
      label: "Explore",
      icon: (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
          <MdExplore className="text-2xl" />
        </span>
      ),
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: (
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <FaBell className="text-2xl" />
          {unreadCount > 0 && (
            <span className="absolute -top-3 -right-4 rounded-full bg-red-500 px-1.5 text-[11px] leading-5 font-bold text-white">
              +{unreadCount}
            </span>
          )}
        </span>
      ),
    },
    {
      href: "/messages",
      label: "Messages",
      icon: (
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
          <FaEnvelope className="text-2xl" />
          {messageUnreadCount > 0 && (
            <span className="absolute -top-3 -right-4 rounded-full bg-red-500 px-1.5 text-[11px] leading-5 font-bold text-white">
              +{messageUnreadCount}
            </span>
          )}
        </span>
      ),
    },
    {
      href: profileHref,
      label: "Profile",
      icon: (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center">
          <FaUserCircle className="text-2xl" />
        </span>
      ),
    },
  ];

  return (
    <>
      <aside className="reddit-left-column bg-panel border-default z-10 hidden sm:sticky sm:top-0 sm:flex sm:h-screen sm:flex-col sm:items-stretch sm:justify-center sm:border-r-1 sm:py-3 lg:px-3">
        <div className="bg-panel text-primary flex h-screen w-full flex-col items-start justify-start sm:static sm:inset-auto sm:bottom-auto sm:z-0 sm:flex sm:h-screen sm:w-full sm:flex-col sm:items-start sm:justify-start sm:gap-2 sm:pl-4 sm:shadow-none">
          <Link
            href={"/"}
            className="hover-panel text-accent hidden sm:flex sm:w-full sm:items-center sm:justify-start sm:space-x-1 sm:rounded-3xl sm:px-1 sm:py-2 sm:pl-5 sm:text-[28px] sm:font-bold sm:transition sm:duration-200"
          >
            <Image
              src="/mig33.png"
              width={56}
              height={56}
              alt="mig33"
              className="animate-[spin_5s] [animation-iteration-count:infinite]"
            />
          </Link>

          {navItems.map(({ href, label, icon, className }) => (
            <Link
              key={label}
              href={href}
              className={`text-primary hover-accent flex w-full items-center justify-center space-x-2 rounded-3xl px-2 py-2 pl-4 text-2xl font-bold transition duration-200 sm:justify-start lg:w-fit lg:px-4 lg:text-xl ${className}`}
            >
              {icon}
              <p className="hidden lg:block">{label}</p>
            </Link>
          ))}
        </div>

        <div className="hidden w-full flex-row justify-between gap-2 rounded-sm px-2 py-2 lg:flex">
          <MiniProfile />
        </div>
      </aside>

      <nav
        aria-label="Mobile navigation"
        className="bg-panel text-primary fixed inset-x-0 bottom-0 z-50 flex flex-row items-center justify-around px-4 py-2 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] sm:hidden"
      >
        {navItems.map(({ href, label, icon, className }) => (
          <Link
            key={label}
            href={href}
            className={`text-primary hover-accent flex items-center justify-center rounded-3xl px-2 py-2 text-2xl font-bold transition duration-200 ${className}`}
            aria-label={label}
          >
            {icon}
          </Link>
        ))}
      </nav>
    </>
  );
};

export default LeftBar;

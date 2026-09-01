"use client";

import { BsSearch } from "react-icons/bs";
import MiniProfile from "./MiniProfile";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRealtimeNotifications } from "./RealtimeProvider";

const NotificationsPage = () => {
  const { notifications, clearUnread } = useRealtimeNotifications();

  useEffect(() => {
    clearUnread();
    fetch("/api/notifications", { method: "PATCH" }).catch(() => {});
  }, [clearUnread]);

  return (
    <div className="reddit-main-column sticky z-10 flex w-full flex-col border-r-1 border-gray-200 py-2">
      <div className="flex h-12 flex-row items-stretch justify-between border-b-1 border-gray-200 sm:hidden">
        <div className="flex cursor-pointer px-4">
          <MiniProfile />
        </div>
        <Link
          href={"/"}
          className="text-blue-40 flex w-fit items-center justify-center space-x-2 rounded-3xl px-4 pr-6 pb-2 text-[28px] font-bold text-blue-400 transition duration-200 hover:bg-gray-200 lg:w-fit lg:px-4"
        >
          <Image
            src="/ReDI.png"
            width={28}
            height={28}
            alt="ReDI"
            className="animate-[spin_5s] [animation-iteration-count:infinite]"
          />
          {/* <p className="hidden lg:block">Twitter</p> */}
        </Link>
        <div className="mr-2 flex h-10 w-fit cursor-pointer rounded-2xl border-1 border-gray-200 px-3 pt-2">
          <BsSearch />
        </div>
      </div>
      <div className="flex min-h-screen flex-col pb-4">
        <div className="border-default bg-panel bg-opacity-80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Link href="/" className="hover-accent rounded-full px-2 text-2xl">
                      ←
                    </Link>
                    <div className="flex-1">
                      <p className="text-xl font-bold">Notifications</p>
                    </div>
                  </div>
                </div>
        {notifications.length === 0 ? (
          <p className="px-4 py-8 text-gray-500">No new notifications.</p>
        ) : (
          <div>
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className="border-b-1 border-gray-200 px-4 py-4 text-base"
              >
                <strong>{notification.actor?.name || "Someone"}</strong>{" "}
                {notification.message}
                <time className="mt-1 block text-sm text-gray-500">
                  {new Date(notification.createdAt).toLocaleString()}
                </time>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

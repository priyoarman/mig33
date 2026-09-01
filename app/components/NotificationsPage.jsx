"use client";

import Link from "next/link";
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

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRealtimeNotifications } from "./RealtimeProvider";
import NotificationRowSkeletonList from "./skeletons/NotificationRowSkeleton";
import { formatTimeAgo } from "@/lib/date";

function ActorAvatar({ actor }) {
  return actor?.profileImage ? (
    <div className="avatar-square h-10 w-10 shrink-0 overflow-hidden rounded-full">
      <img
        src={actor.profileImage}
        alt=""
        className="h-full w-full rounded-full object-cover"
      />
    </div>
  ) : (
    <span className="bg-accent text-on-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">
      {actor?.name?.charAt(0)?.toUpperCase() || "?"}
    </span>
  );
}

const NotificationsPage = () => {
  const { notifications, notificationsLoading, clearUnread } =
    useRealtimeNotifications();

  useEffect(() => {
    fetch("/api/notifications", { method: "PATCH" })
      .then((response) => {
        if (response.ok) clearUnread();
      })
      .catch(() => {});
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
        {notificationsLoading ? (
          <NotificationRowSkeletonList count={8} />
        ) : notifications.length === 0 ? (
          <p className="px-4 py-8 text-gray-500">No new notifications.</p>
        ) : (
          <div>
            {notifications.map((notification) => {
              const href = notification.postId
                ? `/posts/${notification.postId}`
                : notification.actor?.username
                  ? `/profile/${notification.actor.username}`
                  : null;
              const content = (
                <div className="flex items-start gap-3">
                  <ActorAvatar actor={notification.actor} />
                  <div className="min-w-0 flex-1">
                    <strong>{notification.actor?.name || "Someone"}</strong>{" "}
                    {notification.message}
                    <time className="mt-1 block text-sm text-gray-500">
                      {formatTimeAgo(notification.createdAt)}
                    </time>
                    {notification.postSnippet && (
                      <p className="mt-2 truncate rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
                        {notification.postSnippet}
                      </p>
                    )}
                  </div>
                </div>
              );

              return href ? (
                <Link
                  key={notification.id}
                  href={href}
                  className="hover-panel block border-b-1 border-gray-200 px-4 py-4 text-base"
                >
                  {content}
                </Link>
              ) : (
                <article
                  key={notification.id}
                  className="border-b-1 border-gray-200 px-4 py-4 text-base"
                >
                  {content}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;

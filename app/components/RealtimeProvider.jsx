"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";

const RealtimeContext = createContext({
  notifications: [],
  notificationsLoading: true,
  unreadCount: 0,
  messageUnreadCount: 0,
  socket: null,
  socketError: "",
  clearUnread: () => {},
  markConversationRead: () => {},
});

export function RealtimeProvider({ children }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [socketError, setSocketError] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setSocket(null);
      setSocketError("");
      setMessageUnreadCount(0);
      if (status !== "loading") setNotificationsLoading(false);
      return undefined;
    }

    fetch("/api/notifications")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setNotificationsLoading(false));

    fetch("/api/messages")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        setMessageUnreadCount(data.unreadTotal || 0);
      })
      .catch(() => {});

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    const canUseLocalSocket =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const socket =
      socketUrl || canUseLocalSocket
        ? io(socketUrl || window.location.origin, {
            withCredentials: true,
            auth: { userId: session.user.id.toString() },
          })
        : null;
    setSocket(socket);
    const loadNotifications = () => {
      fetch("/api/notifications")
        .then((response) => (response.ok ? response.json() : null))
        .then((data) => {
          if (!data) return;
          setNotifications((current) => {
            // Freshly-fetched notifications are authoritative; they must be
            // merged in last so they overwrite any stale client-held copy
            // of the same id in the Map.
            const merged = [...current, ...(data.notifications || [])];
            return [
              ...new Map(merged.map((item) => [item.id, item])).values(),
            ]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .slice(0, 50);
          });
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    };
    const notificationPoll = setInterval(loadNotifications, 5000);
    if (!socket) {
      return () => clearInterval(notificationPoll);
    }
    const handleSocketError = () => {
      setSocketError(
        "Live updates are unavailable right now. Trying to reconnect...",
      );
    };
    const handleSocketConnect = () => setSocketError("");
    socket.on("connect_error", handleSocketError);
    socket.on("disconnect", handleSocketError);
    socket.on("connect", handleSocketConnect);

    socket.on("notification", (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 50));
      setUnreadCount((current) => current + 1);
    });

    socket.on("message", () => {
      setMessageUnreadCount((current) => current + 1);
    });

    return () => {
      socket.disconnect();
      clearInterval(notificationPoll);
      socket.off("connect_error", handleSocketError);
      socket.off("disconnect", handleSocketError);
      socket.off("connect", handleSocketConnect);
      socket.off("message");
      setSocket((current) => (current === socket ? null : current));
    };
  }, [session?.user?.id, status]);

  const markConversationRead = useCallback((otherUserId) => {
    if (!otherUserId) return Promise.resolve(0);
    return fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: otherUserId }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        const marked = data?.markedCount || 0;
        if (marked > 0) {
          setMessageUnreadCount((current) => Math.max(0, current - marked));
        }
        return marked;
      })
      .catch(() => 0);
  }, []);

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        notificationsLoading,
        unreadCount,
        messageUnreadCount,
        socket,
        socketError,
        clearUnread: () => setUnreadCount(0),
        markConversationRead,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeNotifications() {
  return useContext(RealtimeContext);
}

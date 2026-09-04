"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";

const RealtimeContext = createContext({
  notifications: [],
  unreadCount: 0,
  messageUnreadCount: 0,
  socket: null,
  socketError: "",
  clearUnread: () => {},
  clearMessageUnread: () => {},
});

export function RealtimeProvider({ children }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageUnreadCount, setMessageUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [socketError, setSocketError] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setSocket(null);
      setSocketError("");
      setMessageUnreadCount(0);
      return undefined;
    }

    fetch("/api/notifications")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!data) return;
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
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
            const merged = [...(data.notifications || []), ...current];
            return [
              ...new Map(merged.map((item) => [item.id, item])).values(),
            ].slice(0, 50);
          });
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {});
    };
    const notificationPoll = setInterval(loadNotifications, 5000);
    if (!socket) {
      return () => clearInterval(notificationPoll);
    }
    const handleSocketError = (error) => {
      setSocketError("");
    };
    const handleSocketConnect = () => setSocketError("");
    socket.on("connect_error", handleSocketError);
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
      socket.off("connect", handleSocketConnect);
      socket.off("message");
      setSocket((current) => (current === socket ? null : current));
    };
  }, [session?.user?.id, status]);

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        unreadCount,
        messageUnreadCount,
        socket,
        socketError,
        clearUnread: () => setUnreadCount(0),
        clearMessageUnread: () => setMessageUnreadCount(0),
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeNotifications() {
  return useContext(RealtimeContext);
}

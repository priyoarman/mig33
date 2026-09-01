"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";

const RealtimeContext = createContext({
  notifications: [],
  unreadCount: 0,
  socket: null,
  socketError: "",
  clearUnread: () => {},
});

export function RealtimeProvider({ children }) {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [socket, setSocket] = useState(null);
  const [socketError, setSocketError] = useState("");

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      setSocket(null);
      setSocketError("");
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

    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin,
      {
        withCredentials: true,
        auth: { userId: session.user.id.toString() },
      },
    );
    setSocket(socket);
    const handleSocketError = (error) => {
      setSocketError(error?.message || "Live messaging is unavailable");
    };
    const handleSocketConnect = () => setSocketError("");
    socket.on("connect_error", handleSocketError);
    socket.on("connect", handleSocketConnect);

    socket.on("notification", (notification) => {
      setNotifications((current) => [notification, ...current].slice(0, 50));
      setUnreadCount((current) => current + 1);
    });

    return () => {
      socket.disconnect();
      socket.off("connect_error", handleSocketError);
      socket.off("connect", handleSocketConnect);
      setSocket((current) => (current === socket ? null : current));
    };
  }, [session?.user?.id, status]);

  return (
    <RealtimeContext.Provider
      value={{
        notifications,
        unreadCount,
        socket,
        socketError,
        clearUnread: () => setUnreadCount(0),
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeNotifications() {
  return useContext(RealtimeContext);
}

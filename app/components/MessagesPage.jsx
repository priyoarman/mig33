"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { BsSearch, BsCheck, BsCheckAll } from "react-icons/bs";
import { FaPaperPlane } from "react-icons/fa6";
import { useRealtimeNotifications } from "./RealtimeProvider";
import Link from "next/link";
import ConversationRowSkeletonList, {
  MessageBubbleSkeletonList,
} from "./skeletons/ConversationRowSkeleton";
import { formatTimeAgo } from "@/lib/date";

const PAGE_SIZE = 30;

function UserAvatar({ user }) {
  return user?.profileImage ? (
    <div className="avatar-square h-10 w-10 overflow-hidden rounded-full">
      <img
        src={user.profileImage}
        alt=""
        className="h-full w-full rounded-full object-cover"
      />
    </div>
  ) : (
    <span className="bg-accent text-on-accent flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold">
      {user?.name?.charAt(0)?.toUpperCase() || "?"}
    </span>
  );
}

const genClientId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Merges freshly-received messages (from a socket event, an ack, or a poll)
// into the existing list without discarding anything: replaces a message by
// real _id if we already have it (e.g. a read-status update), replaces a
// pending optimistic placeholder by clientId once the server confirms it,
// and otherwise appends. This keeps previously-loaded older pages intact
// instead of the old behavior of clobbering the whole array on every poll.
function mergeMessages(incoming, previous) {
  let next = previous;
  for (const serverMsg of incoming) {
    const byId = next.findIndex((m) => m._id === serverMsg._id);
    if (byId !== -1) {
      next = next.map((m, i) => (i === byId ? { ...serverMsg } : m));
      continue;
    }
    const byClientId = serverMsg.clientId
      ? next.findIndex((m) => m.clientId === serverMsg.clientId)
      : -1;
    if (byClientId !== -1) {
      next = next.map((m, i) => (i === byClientId ? { ...serverMsg } : m));
      continue;
    }
    next = [...next, serverMsg];
  }
  return next.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

const MessagesPage = () => {
  const { data: session, status } = useSession();
  const { socket, socketError, markConversationRead } =
    useRealtimeNotifications();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [incomingNotice, setIncomingNotice] = useState("");
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const conversationRequestRef = useRef(0);
  const shouldScrollToBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(null);

  const loadConversations = () => {
    fetch("/api/messages")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setConversations(data?.conversations || []))
      .catch(() => {})
      .finally(() => setConversationsLoading(false));
  };

  useEffect(() => {
    if (status !== "authenticated") return undefined;
    loadConversations();
    const timer = setInterval(loadConversations, 5000);
    return () => clearInterval(timer);
  }, [status]);

  const loadConversation = async (userId) => {
    const requestId = ++conversationRequestRef.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/messages?userId=${encodeURIComponent(userId)}&limit=${PAGE_SIZE}`,
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load messages");
      // A newer conversation open/switch happened while this was in flight;
      // discard this stale response instead of overwriting the newer state.
      if (requestId !== conversationRequestRef.current) return;
      shouldScrollToBottomRef.current = true;
      setActiveUser(data.user);
      setMessages(data.messages || []);
      setHasMoreOlder(!!data.hasMore);
      markConversationRead(userId);
    } catch (loadError) {
      if (requestId !== conversationRequestRef.current) return;
      setError(loadError.message);
      setMessages([]);
      setHasMoreOlder(false);
    } finally {
      if (requestId === conversationRequestRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const requestedUserId = new URLSearchParams(window.location.search).get(
      "userId",
    );
    if (status !== "authenticated" || !requestedUserId) return;
    loadConversation(requestedUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const loadOlderMessages = async () => {
    if (!activeUser || loadingOlder || !hasMoreOlder || !messages.length) return;
    setLoadingOlder(true);
    const oldest = messages[0];
    const container = scrollContainerRef.current;
    prevScrollHeightRef.current = container ? container.scrollHeight : null;
    try {
      const response = await fetch(
        `/api/messages?userId=${activeUser._id}&limit=${PAGE_SIZE}&before=${encodeURIComponent(oldest.createdAt)}`,
      );
      if (!response.ok) return;
      const data = await response.json();
      shouldScrollToBottomRef.current = false;
      setMessages((current) => [...(data.messages || []), ...current]);
      setHasMoreOlder(!!data.hasMore);
    } finally {
      setLoadingOlder(false);
    }
  };

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 60 && hasMoreOlder && !loadingOlder) {
      loadOlderMessages();
    }
  };

  // Keep the scroll position stable after prepending older messages instead
  // of jumping the viewport, and only auto-scroll to bottom for genuinely
  // new messages (sent, received, or on first open).
  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (prevScrollHeightRef.current != null) {
      const delta = container.scrollHeight - prevScrollHeightRef.current;
      container.scrollTop = delta;
      prevScrollHeightRef.current = null;
      return;
    }
    if (shouldScrollToBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      shouldScrollToBottomRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search/users?q=${encodeURIComponent(query.trim())}&limit=8`, {
        signal: controller.signal,
      })
        .then((response) => response.json())
        .then((data) =>
          setUsers(
            (data.users || []).filter(
              (user) => user._id?.toString() !== session?.user?.id?.toString(),
            ),
          ),
        )
        .catch((err) => {
          if (err.name !== "AbortError") setUsers([]);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, session?.user?.id]);

  useEffect(() => {
    if (!socket) return undefined;
    const receiveMessage = (message) => {
      if (
        activeUser &&
        message.senderId === activeUser._id &&
        message.recipientId === session?.user?.id
      ) {
        shouldScrollToBottomRef.current = true;
        setMessages((current) => mergeMessages([message], current));
        markConversationRead(activeUser._id);
      } else if (message.recipientId === session?.user?.id) {
        setIncomingNotice("New message received");
        loadConversations();
      }
    };
    const handleReadReceipt = ({ byUserId }) => {
      if (!activeUser || byUserId !== activeUser._id) return;
      setMessages((current) =>
        current.map((m) =>
          m.senderId === session?.user?.id ? { ...m, read: true } : m,
        ),
      );
    };
    socket.on("message", receiveMessage);
    socket.on("messages_read", handleReadReceipt);
    return () => {
      socket.off("message", receiveMessage);
      socket.off("messages_read", handleReadReceipt);
    };
  }, [activeUser, session?.user?.id, socket, markConversationRead]);

  // Fallback for when the socket is unavailable: periodically pull the
  // latest page and merge it in without discarding older loaded pages.
  useEffect(() => {
    if (!activeUser || (socket && socket.connected)) return undefined;
    const timer = setInterval(async () => {
      const response = await fetch(
        `/api/messages?userId=${activeUser._id}&limit=${PAGE_SIZE}`,
      );
      if (!response.ok) return;
      const data = await response.json();
      setMessages((current) => mergeMessages(data.messages || [], current));
    }, 5000);
    return () => clearInterval(timer);
  }, [activeUser, socket, socket?.connected]);

  const openConversation = (user) => {
    setIncomingNotice("");
    setQuery("");
    setUsers([]);
    loadConversation(user._id);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = content.trim();
    if (!text || !activeUser || sending) {
      return;
    }
    setSending(true);
    setError("");
    const clientId = genClientId();
    const optimisticMessage = {
      _id: `pending-${clientId}`,
      clientId,
      senderId: session.user.id,
      recipientId: activeUser._id,
      content: text,
      read: false,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    shouldScrollToBottomRef.current = true;
    setMessages((current) => [...current, optimisticMessage]);
    setContent("");

    const markFailed = (errorMessage) => {
      setMessages((current) =>
        current.map((m) =>
          m.clientId === clientId
            ? { ...m, status: "failed", error: errorMessage }
            : m,
        ),
      );
      setError(errorMessage);
    };

    const markSent = (realMessage) => {
      setMessages((current) => mergeMessages([realMessage], current));
      loadConversations();
    };

    if (!socket || !socket.connected) {
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientId: activeUser._id,
            content: text,
            clientId,
          }),
        });
        const result = await response.json();
        if (!response.ok || !result.message) {
          throw new Error(result.error || "Message could not be sent.");
        }
        markSent(result.message);
      } catch (sendError) {
        markFailed(sendError.message);
      } finally {
        setSending(false);
      }
      return;
    }

    let settled = false;
    const timeout = setTimeout(async () => {
      if (settled) return;
      setSending(false);
      // The ack may simply be late rather than lost, and the message was
      // already persisted server-side before the ack is sent — reconcile
      // against the server instead of assuming failure and inviting a
      // duplicate resend.
      try {
        const response = await fetch(
          `/api/messages?userId=${activeUser._id}&limit=${PAGE_SIZE}`,
        );
        if (response.ok) {
          const data = await response.json();
          const confirmed = (data.messages || []).find(
            (m) => m.clientId === clientId,
          );
          if (confirmed) {
            settled = true;
            markSent(confirmed);
            return;
          }
        }
      } catch {
        // fall through to marking as failed
      }
      markFailed("Message could not be confirmed. Tap to retry.");
    }, 10000);

    socket.emit(
      "send_message",
      { recipientId: activeUser._id, content: text, clientId },
      (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        setSending(false);
        if (!result?.message || result.error) {
          markFailed(result?.error || "Message could not be sent. Please try again.");
          return;
        }
        markSent(result.message);
      },
    );
  };

  const retryMessage = (failedMessage) => {
    setMessages((current) =>
      current.filter((m) => m.clientId !== failedMessage.clientId),
    );
    setContent(failedMessage.content);
  };

  if (status !== "authenticated")
    return (
      <div className="p-8 text-center text-gray-600">
        Sign in to send messages.
      </div>
    );

  return (
    <div className="bg-panel text-primary flex min-h-screen w-full flex-col border-r border-gray-200">
      <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-3 py-1">
          <Link
            href={activeUser ? "/messages" : "/"}
            aria-label={activeUser ? "Back to conversations" : "Go home"}
            onClick={() => {
              if (activeUser) {
                setActiveUser(null);
                setMessages([]);
                setLoading(false);
              }
            }}
            className="hover-accent rounded-full px-2 text-2xl"
          >
            ←
          </Link>
          <div className="flex-1">
            <p className="text-xl font-bold">Messages</p>
          </div>
        </div>
      </header>
      {socketError && (
        <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {socketError}
        </p>
      )}
      {!activeUser ? (
        <section className="mx-auto w-full max-w-2xl px-4 py-5">
          <label className="bg-input flex items-center gap-3 rounded-full px-4 py-3 text-gray-500">
            <BsSearch />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search someone to message"
              className="text-primary min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
          <div className="mt-4 divide-y divide-gray-200">
            {conversationsLoading && <ConversationRowSkeletonList count={6} />}
            {incomingNotice && (
              <button
                type="button"
                onClick={() => setIncomingNotice("")}
                className="w-full cursor-pointer border-b border-blue-200 bg-blue-50 px-3 py-2 text-left text-sm text-blue-700"
              >
                {incomingNotice}
              </button>
            )}
            {conversations.map(({ user, latestMessage, unreadCount }) => (
              <button
                key={user._id}
                type="button"
                onClick={() => openConversation(user)}
                className="hover-panel flex w-full cursor-pointer items-center gap-3 px-3 py-4 text-left"
              >
                <UserAvatar user={user} />
                <span className="min-w-0 flex-1">
                  <strong className="block">{user.name}</strong>
                  <span className="block truncate text-sm text-gray-500">
                    {latestMessage.content}
                  </span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(latestMessage.createdAt)}
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-accent text-on-accent rounded-full px-1.5 text-[11px] leading-5 font-bold">
                      {unreadCount}
                    </span>
                  )}
                </span>
              </button>
            ))}
            {users.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => openConversation(user)}
                className="hover-panel flex w-full cursor-pointer items-center gap-3 px-3 py-4 text-left"
              >
                <UserAvatar user={user} />
                <span>
                  <strong className="block">{user.name}</strong>
                  <span className="text-sm text-gray-500">
                    @{user.username}
                  </span>
                </span>
              </button>
            ))}
          </div>
          {!conversationsLoading && !query && !conversations.length && (
            <p className="mt-16 text-center text-gray-500">
              Search for a user to start a conversation.
            </p>
          )}
          {!conversationsLoading && query && !users.length && (
            <p className="mt-8 text-center text-gray-500">No users found.</p>
          )}
        </section>
      ) : (
        <section className="flex min-h-[calc(100vh-65px)] flex-1 flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
            <Link href={`/profile/${activeUser.username}`} className="shrink-0">
              <UserAvatar user={activeUser} />
            </Link>
            <Link href={`/profile/${activeUser.username}`} className="hover:underline">
              <strong className="block">{activeUser.name}</strong>
              <span className="text-sm text-gray-500">
                @{activeUser.username}
              </span>
            </Link>
          </div>
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-5"
          >
            {loadingOlder && (
              <p className="text-center text-xs text-gray-400">
                Loading older messages...
              </p>
            )}
            {loading && <MessageBubbleSkeletonList count={6} />}
            {!loading && !messages.length && (
              <p className="m-auto text-center text-gray-500">
                No messages yet. Say hello.
              </p>
            )}
            {messages.map((message) => {
              const mine = message.senderId === session.user.id;
              const isFailed = message.status === "failed";
              const isPending = message.status === "pending";
              return (
                <div
                  key={message._id}
                  className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                >
                  <p
                    onClick={() => isFailed && retryMessage(message)}
                    className={`${mine ? "bg-accent text-on-accent" : "bg-input text-primary"} max-w-[78%] rounded-2xl px-4 py-2 text-base ${isPending ? "opacity-60" : ""} ${isFailed ? "cursor-pointer border-2 border-red-400 opacity-80" : ""}`}
                  >
                    {message.content}
                  </p>
                  {mine && !isFailed && (
                    <span className="mt-0.5 flex items-center gap-1 px-1 text-xs text-gray-400">
                      {isPending ? (
                        "Sending..."
                      ) : message.read ? (
                        <BsCheckAll className="text-blue-500" size={14} />
                      ) : (
                        <BsCheck size={14} />
                      )}
                    </span>
                  )}
                  {isFailed && (
                    <span className="mt-0.5 px-1 text-xs text-red-500">
                      {message.error || "Failed to send"} · Tap to retry
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          {error && <p className="px-4 pb-2 text-sm text-red-500">{error}</p>}
          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-gray-200 p-3"
          >
            <input
              value={content}
              onChange={(event) => setContent(event.target.value)}
              maxLength={2000}
              placeholder="Write a message..."
              className="bg-input text-primary min-w-0 flex-1 rounded-full px-4 py-3 text-base outline-none"
            />
            <button
              type="submit"
              disabled={sending || !content.trim()}
              title="Send message"
              className="bg-accent text-on-accent flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaPaperPlane />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};

export default MessagesPage;

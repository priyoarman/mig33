"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { BsSearch } from "react-icons/bs";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa6";
import MiniProfile from "./MiniProfile";
import { useRealtimeNotifications } from "./RealtimeProvider";
import Link from "next/link";

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

const MessagesPage = () => {
  const { data: session, status } = useSession();
  const { socket, socketError } = useRealtimeNotifications();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [incomingNotice, setIncomingNotice] = useState("");
  const messagesEndRef = useRef(null);

  const loadConversations = () => {
    fetch("/api/messages")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setConversations(data?.conversations || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (status !== "authenticated") return undefined;
    loadConversations();
    const timer = setInterval(loadConversations, 5000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/search/users?q=${encodeURIComponent(query.trim())}&limit=8`)
        .then((response) => response.json())
        .then((data) =>
          setUsers(
            (data.users || []).filter(
              (user) => user._id?.toString() !== session?.user?.id?.toString(),
            ),
          ),
        )
        .catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, session?.user?.id]);

  useEffect(() => {
    if (!socket) return undefined;
    const receiveMessage = (message) => {
      if (
        activeUser &&
        message.senderId === activeUser._id &&
        message.recipientId === session?.user?.id
      ) {
        setMessages((current) =>
          current.some((item) => item._id === message._id)
            ? current
            : [...current, message],
        );
      } else if (message.recipientId === session?.user?.id) {
        setIncomingNotice("New message received");
        loadConversations();
      }
    };
    socket.on("message", receiveMessage);
    return () => socket.off("message", receiveMessage);
  }, [activeUser, session?.user?.id, socket]);

  useEffect(() => {
    if (!activeUser) return undefined;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/messages?userId=${activeUser._id}`);
      if (!response.ok) return;
      const data = await response.json();
      setMessages(data.messages || []);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const openConversation = async (user) => {
    setActiveUser(user);
    setIncomingNotice("");
    setQuery("");
    setUsers([]);
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/messages?userId=${user._id}`);
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Unable to load messages");
      setMessages(data.messages || []);
    } catch (loadError) {
      setError(loadError.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    const text = content.trim();
    if (!text || !activeUser || sending) {
      return;
    }
    setSending(true);
    setError("");
    if (!socket || !socket.connected) {
      try {
        const response = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientId: activeUser._id, content: text }),
        });
        const result = await response.json();
        if (!response.ok || !result.message) {
          throw new Error(result.error || "Message could not be sent.");
        }
        setMessages((current) => [...current, result.message]);
        setContent("");
        loadConversations();
      } catch (sendError) {
        setError(sendError.message);
      } finally {
        setSending(false);
      }
      return;
    }
    let acknowledged = false;
    const timeout = setTimeout(() => {
      if (!acknowledged) {
        setSending(false);
        setError("Message could not be sent. Please try again.");
      }
    }, 10000);
    socket.emit(
      "send_message",
      { recipientId: activeUser._id, content: text },
      (result) => {
        acknowledged = true;
        clearTimeout(timeout);
        setSending(false);
        if (!result?.message || result.error) {
          setError(
            result?.error || "Message could not be sent. Please try again.",
          );
          return;
        }
        setMessages((current) =>
          current.some((item) => item._id === result.message._id)
            ? current
            : [...current, result.message],
        );
        setContent("");
      },
    );
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
        {activeUser && (
          <button
            type="button"
            title="Back to conversations"
            onClick={() => setActiveUser(null)}
            className="hover-panel rounded-full p-2"
          >
            <FaArrowLeft />
          </button>
        )}
        <div className="flex items-center gap-3 py-1">
          <Link href="/" className="hover-accent rounded-full px-2 text-2xl">
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
            {incomingNotice && (
              <button
                type="button"
                onClick={() => setIncomingNotice("")}
                className="w-full border-b border-blue-200 bg-blue-50 px-3 py-2 text-left text-sm text-blue-700"
              >
                {incomingNotice}
              </button>
            )}
            {conversations.map(({ user, latestMessage }) => (
              <button
                key={user._id}
                type="button"
                onClick={() => openConversation(user)}
                className="hover-panel flex w-full items-center gap-3 px-3 py-4 text-left"
              >
                <UserAvatar user={user} />
                <span className="min-w-0 flex-1">
                  <strong className="block">{user.name}</strong>
                  <span className="block truncate text-sm text-gray-500">
                    {latestMessage.content}
                  </span>
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(latestMessage.createdAt).toLocaleDateString()}
                </span>
              </button>
            ))}
            {users.map((user) => (
              <button
                key={user._id}
                type="button"
                onClick={() => openConversation(user)}
                className="hover-panel flex w-full items-center gap-3 px-3 py-4 text-left"
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
          {!query && !conversations.length && (
            <p className="mt-16 text-center text-gray-500">
              Search for a user to start a conversation.
            </p>
          )}
          {query && !users.length && (
            <p className="mt-8 text-center text-gray-500">No users found.</p>
          )}
        </section>
      ) : (
        <section className="flex min-h-[calc(100vh-65px)] flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
            <UserAvatar user={activeUser} />
            <span>
              <strong className="block">{activeUser.name}</strong>
              <span className="text-sm text-gray-500">
                @{activeUser.username}
              </span>
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-5">
            {loading && (
              <p className="text-center text-gray-500">Loading messages...</p>
            )}
            {!loading && !messages.length && (
              <p className="m-auto text-center text-gray-500">
                No messages yet. Say hello.
              </p>
            )}
            {messages.map((message) => {
              const mine = message.senderId === session.user.id;
              return (
                <div
                  key={message._id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <p
                    className={`${mine ? "bg-accent text-on-accent" : "bg-input text-primary"} max-w-[78%] rounded-2xl px-4 py-2 text-base`}
                  >
                    {message.content}
                  </p>
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
              className="bg-accent text-on-accent flex h-12 w-12 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
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

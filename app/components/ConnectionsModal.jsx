"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const ConnectionsModal = ({ type, users, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const title = type === "followers" ? "Followers" : "Following";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="bg-panel text-primary w-full max-w-md overflow-hidden rounded-xl shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="connections-title"
      >
        <div className="border-default flex items-center justify-between border-b px-5 py-4">
          <h2 id="connections-title" className="text-lg font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted cursor-pointer px-2 text-2xl leading-none hover:text-red-500"
          >
            &times;
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {users.length ? (
            users.map((user) => (
              <Link
                key={user._id}
                href={`/profile/${user.username}`}
                onClick={onClose}
                className="hover-panel flex items-center gap-3 px-5 py-3"
              >
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500 font-bold text-white">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{user.name}</div>
                  <div className="text-muted truncate text-xs">
                    @{user.username}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-muted px-5 py-8 text-center text-sm">
              No {title.toLowerCase()} yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectionsModal;

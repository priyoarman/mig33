"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

const RightBarBottom = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingIds, setPendingIds] = useState(new Set());

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/users/suggestions");
        const data = await res.json();
        setUsers(Array.isArray(data.users) ? data.users : []);
      } catch (error) {
        console.error("Failed to fetch suggested users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [session?.user?.id]);

  const handleFollow = async (userId) => {
    if (!session?.user?.id) return;

    setPendingIds((prev) => new Set(prev).add(userId));

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to update follow status");
      }

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user._id === userId
            ? {
                ...user,
                isFollowing: data.following,
                followersCount: data.followersCount,
              }
            : user,
        ),
      );
    } catch (error) {
      console.error("Follow toggle failed:", error);
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  return (
    <div className="border-default bg-panel text-primary flex flex-col space-y-3 rounded-xl border pt-2">
      <h3 className="px-4 pt-2 text-xl font-bold">Who to follow</h3>

      {loading ? (
        <div className="text-muted px-4 pb-4 text-sm">
          Loading suggestions...
        </div>
      ) : users.length === 0 ? (
        <div className="text-muted px-4 pb-4 text-sm">
          No profiles to suggest right now.
        </div>
      ) : (
        <div>
          {users.map((user) => {
            const isDisabled = !session?.user?.id || pendingIds.has(user._id);

            return (
              <div
                key={user._id}
                className="hover-panel flex items-center justify-between gap-3 p-4 transition duration-200 last:rounded-b-xl"
              >
                <div className="flex min-w-0 items-center space-x-2">
                  {user.profileImage ? (
                    <Image
                      src={user.profileImage}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="h-10 w-10 flex-none rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-neutral-600 text-sm font-bold text-white">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold">
                      {user.name}
                    </div>
                    <div className="text-muted truncate text-xs font-medium">
                      @{user.username}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleFollow(user._id)}
                  disabled={isDisabled}
                  className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-white transition text-shadow-xs ${
                    user.isFollowing
                      ? "bg-cyan-500 hover:bg-cyan-600"
                      : "bg-gray-500 hover:bg-cyan-500"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  {pendingIds.has(user._id)
                    ? "..."
                    : user.isFollowing
                      ? "Following"
                      : session?.user?.id
                        ? "Follow"
                        : "Login!"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RightBarBottom;

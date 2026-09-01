"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const RightBarBottom = () => {
  const router = useRouter();
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

      if (data.following) {
        setUsers((currentUsers) =>
          currentUsers.filter((user) => user._id !== userId),
        );
      }

      const suggestionsRes = await fetch("/api/users/suggestions", {
        cache: "no-store",
      });
      const suggestionsData = await suggestionsRes.json();
      setUsers(
        suggestionsRes.ok && Array.isArray(suggestionsData.users)
          ? suggestionsData.users
          : [],
      );
      router.refresh();
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
                <Link
                  href={`/profile/${user.username}`}
                  className="flex min-w-0 flex-1 items-center space-x-2"
                >
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
                    <div className="truncate text-sm font-bold hover:underline">
                      {user.name}
                    </div>
                    <div className="text-muted truncate text-xs font-medium">
                      @{user.username}
                    </div>
                  </div>
                </Link>

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

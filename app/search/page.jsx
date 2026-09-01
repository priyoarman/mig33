"use client";

import { Suspense } from "react";

// export const dynamic = "force-dynamic";
// export const revalidate = 0;

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PostCard from "../components/PostCard";
import { BsSearch } from "react-icons/bs";

const SearchResults = () => {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [activeTab, setActiveTab] = useState("all"); // all, posts, users
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim()) return;

    const fetchResults = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [postsRes, usersRes] = await Promise.all([
          fetch(`/api/search/posts?q=${encodeURIComponent(query)}`),
          fetch(`/api/search/users?q=${encodeURIComponent(query)}`),
        ]);

        const postsData = await postsRes.json();
        const usersData = await usersRes.json();

        if (!postsRes.ok) {
          console.error("Posts error:", postsData);
          setPosts([]);
        } else {
          setPosts(postsData.posts || ["No posts found"]);
        }

        if (!usersRes.ok) {
          console.error("Users error:", usersData);
          setUsers([]);
        } else {
          setUsers(usersData.users || ["No users found"]);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to fetch search results");
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  const filteredPosts =
    activeTab === "all" || activeTab === "posts" ? posts : [];
  const filteredUsers =
    activeTab === "all" || activeTab === "users" ? users : [];

  return (
    <div className="reddit-main-column bg-panel text-primary flex h-screen w-full overflow-hidden">
      <div className="border-default flex w-full flex-1 flex-col border-r">
        {/* Search Header */}
        <div className="border-default bg-panel bg-opacity-80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover-accent rounded-full p-2 text-2xl">
              ←
            </Link>
            <div className="flex-1">
              <p className="text-xl font-bold">Search Results</p>
              <p className="text-secondary text-sm">
                {query.length > 50 ? query.substring(0, 50) + "..." : query}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-default bg-panel bg-opacity-80 sticky top-14 z-10 flex border-b backdrop-blur-sm">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 px-4 py-3 text-center font-semibold transition ${
              activeTab === "all"
                ? "border-accent text-accent border-b-2"
                : "text-secondary hover:text-primary"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 px-4 py-3 text-center font-semibold transition ${
              activeTab === "posts"
                ? "border-accent text-accent border-b-2"
                : "text-secondary hover:text-primary"
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`flex-1 px-4 py-3 text-center font-semibold transition ${
              activeTab === "users"
                ? "border-accent text-accent border-b-2"
                : "text-secondary hover:text-primary"
            }`}
          >
            Users ({users.length})
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="animate-spin">
                <BsSearch size={32} className="text-secondary" />
              </div>
            </div>
          ) : (
            <>
              {filteredPosts.length === 0 && filteredUsers.length === 0 ? (
                <div className="flex h-96 flex-col items-center justify-center px-4 text-center">
                  <BsSearch size={48} className="text-secondary mb-4" />
                  <p className="text-xl font-bold">No results found</p>
                  <p className="text-secondary">
                    Try searching for posts, users, or hashtags
                  </p>
                </div>
              ) : (
                <>
                  {/* Posts Results */}
                  {filteredPosts.length > 0 && (
                    <div>
                      {filteredPosts.map((post) => (
                        <PostCard key={post._id} post={post} />
                      ))}
                    </div>
                  )}

                  {/* Users Results */}
                  {filteredUsers.length > 0 && (
                    <div className="border-default border-t">
                      {filteredUsers.map((user) => (
                        <Link
                          key={user._id}
                          href={`/profile/${user.username}`}
                          className="hover-accent border-default flex items-center gap-4 border-b px-4 py-3 transition"
                        >
                          {user.profileImage ? (
                            <Image
                              src={user.profileImage}
                              alt={user.username}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-bold text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-bold">{user.name}</p>
                            <p className="text-secondary truncate">
                              @{user.username}
                            </p>
                            {user.bio && (
                              <p className="text-secondary mt-1 line-clamp-2 text-sm">
                                {user.bio}
                              </p>
                            )}
                            <p className="text-secondary mt-1 text-xs">
                              {user.followers?.length || 0} followers
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-panel flex h-screen items-center justify-center">
          <div className="animate-spin">
            <BsSearch size={32} className="text-secondary" />
          </div>
        </div>
      }
    >
      <SearchResults />
    </Suspense>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BsSearch } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import Image from "next/image";
import SearchUserRowSkeletonList from "./skeletons/SearchUserRowSkeleton";
import type { PostSummary, UserProfile } from "@/types";

type PostSearchResult = Pick<
  PostSummary,
  "_id" | "body" | "authorUsername" | "authorImage"
>;
type UserSearchResult = Pick<
  UserProfile,
  "_id" | "name" | "username" | "profileImage"
>;
type ResultsTab = "all" | "posts" | "users";

type MobileSearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function MobileSearchModal({
  isOpen,
  onClose,
}: MobileSearchModalProps) {
  const { status } = useSession();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{
    posts: PostSearchResult[];
    users: UserSearchResult[];
  }>({ posts: [], users: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<ResultsTab>("all");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const fetchSuggestions = useCallback(async (query: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      setIsSearching(true);
      const [postsRes, usersRes] = await Promise.all([
        fetch(`/api/search/posts?q=${encodeURIComponent(query)}&limit=5`, {
          signal: controller.signal,
        }),
        fetch(`/api/search/users?q=${encodeURIComponent(query)}&limit=5`, {
          signal: controller.signal,
        }),
      ]);

      const postsData = (await postsRes.json()) as { posts?: PostSearchResult[] };
      const usersData = (await usersRes.json()) as { users?: UserSearchResult[] };

      setSuggestions({
        posts: Array.isArray(postsData.posts) ? postsData.posts : [],
        users: Array.isArray(usersData.users) ? usersData.users : [],
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      console.error("Search error:", error);
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (!searchQuery.trim()) {
      setSuggestions({ posts: [], users: [] });
      abortRef.current?.abort();
      return;
    }
    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen, fetchSuggestions]);

  const closeAndReset = useCallback(() => {
    setSearchQuery("");
    setSuggestions({ posts: [], users: [] });
    setActiveTab("all");
    onClose();
  }, [onClose]);

  const handleSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    if (status === "authenticated") {
      fetch("/api/search/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, type: "all" }),
      }).catch((error) => console.error("Error saving search history:", error));
    }

    router.push(`/explore?tab=search&q=${encodeURIComponent(trimmed)}`);
    closeAndReset();
  };

  const handleSelectSuggestion = (
    suggestion: PostSearchResult | UserSearchResult,
    type: "user" | "post",
  ) => {
    if (type === "user" && "username" in suggestion) {
      router.push(`/profile/${suggestion.username}`);
    } else if (type === "post") {
      router.push(`/posts/${suggestion._id}/comments`);
    }
    closeAndReset();
  };

  if (!isOpen) return null;

  const displayPosts = suggestions.posts || [];
  const displayUsers = suggestions.users || [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/10 px-4 pt-16 backdrop-blur-[1px]"
      onClick={closeAndReset}
    >
      <div
        className="border-default bg-panel flex max-h-[80vh] w-full max-w-[560px] flex-col overflow-hidden rounded-[22px] border shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-default bg-surface flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-600">
              <BsSearch className="text-sm" />
            </div>
            <h2 className="text-primary text-sm font-semibold">Search</h2>
          </div>
          <button
            type="button"
            onClick={closeAndReset}
            className="hover-panel text-muted hover:text-primary flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-xl transition"
          >
            &times;
          </button>
        </div>

        <div className="p-3">
          <div className="border-default bg-surface flex items-center gap-2 rounded-xl border px-3 py-2">
            <BsSearch className="text-muted h-4 w-4 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for posts, users, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch(searchQuery);
              }}
              className="text-primary w-full border-0 bg-transparent text-base outline-none placeholder:text-[color:var(--muted)] sm:text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSuggestions({ posts: [], users: [] });
                }}
                className="text-muted hover:text-primary shrink-0 cursor-pointer"
              >
                <MdClose size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[58vh] overflow-y-auto px-3 pb-3">
          {!searchQuery.trim() ? (
            <div className="text-muted p-4 text-center text-sm">
              Search for posts, users, and hashtags
            </div>
          ) : isSearching ? (
            <SearchUserRowSkeletonList count={3} />
          ) : (
            <>
              <div className="border-default bg-panel sticky top-0 flex border-b">
                {(["all", "posts", "users"] as ResultsTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 cursor-pointer px-4 py-2 text-center text-sm font-semibold capitalize ${
                      activeTab === tab
                        ? "border-b-2 border-blue-500 text-blue-500"
                        : "text-muted hover:text-primary"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                {(activeTab === "all" || activeTab === "posts") &&
                  displayPosts.length > 0 && (
                    <>
                      <div className="text-muted px-4 py-2 text-xs font-semibold">
                        POSTS
                      </div>
                      {displayPosts.map((post) => (
                        <button
                          key={post._id}
                          onClick={() => handleSelectSuggestion(post, "post")}
                          className="hover-panel flex w-full cursor-pointer items-center gap-3 rounded px-4 py-2 text-left text-sm"
                        >
                          <div className="avatar-square h-8 w-8 shrink-0 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                            {post.authorImage && (
                              <Image
                                src={post.authorImage}
                                alt={post.authorUsername ?? ""}
                                width={32}
                                height={32}
                                className="h-full w-full rounded-full object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-primary truncate">{post.body}</p>
                            <p className="text-muted text-xs">
                              by @{post.authorUsername}
                            </p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                {(activeTab === "all" || activeTab === "users") &&
                  displayUsers.length > 0 && (
                    <>
                      <div className="text-muted px-4 py-2 text-xs font-semibold">
                        USERS
                      </div>
                      {displayUsers.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => handleSelectSuggestion(user, "user")}
                          className="hover-panel flex w-full cursor-pointer items-center gap-3 rounded px-4 py-2 text-left text-sm"
                        >
                          <div className="avatar-square h-8 w-8 shrink-0 overflow-hidden rounded-full">
                            {user.profileImage ? (
                              <Image
                                src={user.profileImage}
                                alt={user.username}
                                width={32}
                                height={32}
                                className="h-full w-full rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-primary truncate font-semibold">
                              {user.name}
                            </p>
                            <p className="text-muted truncate text-xs">
                              @{user.username}
                            </p>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                {!isSearching &&
                  displayPosts.length === 0 &&
                  displayUsers.length === 0 && (
                    <div className="text-muted p-4 text-center text-sm">
                      No results found
                    </div>
                  )}
              </div>

              <div className="border-default border-t p-2">
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="w-full cursor-pointer rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Search for &quot;{searchQuery}&quot;
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

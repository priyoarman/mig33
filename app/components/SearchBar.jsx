"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BsSearch } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";
import SearchUserRowSkeletonList from "./skeletons/SearchUserRowSkeleton";

export default function SearchBar() {
  const { status } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState({ posts: [], users: [] });
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, posts, users
  const searchRef = useRef(null);
  const abortRef = useRef(null);
  const router = useRouter();

  const loadHistory = useCallback(() => {
    if (status !== "authenticated") return;
    fetch("/api/search/history")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setSearchHistory(data?.searchHistory || []))
      .catch(() => {});
  }, [status]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions({ posts: [], users: [] });
      abortRef.current?.abort();
      return;
    }

    const timer = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestions = useCallback(async (query) => {
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

      const postsData = await postsRes.json();
      const usersData = await usersRes.json();

      setSuggestions({
        posts: Array.isArray(postsData.posts) ? postsData.posts : [],
        users: Array.isArray(usersData.users) ? usersData.users : [],
      });
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Search error:", error);
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  }, []);

  const handleSearch = async (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    // Save to search history (signed-in users only)
    if (status === "authenticated") {
      fetch("/api/search/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, type: "all" }),
      })
        .then(() => loadHistory())
        .catch((error) => console.error("Error saving search history:", error));
    }

    setSearchQuery("");
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const removeHistoryItem = async (query, event) => {
    event.stopPropagation();
    setSearchHistory((current) => current.filter((item) => item.query !== query));
    try {
      await fetch(`/api/search/history?query=${encodeURIComponent(query)}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error removing search history item:", error);
    }
  };

  const handleSelectSuggestion = (suggestion, type) => {
    if (type === "user") {
      router.push(`/profile/${suggestion.username}`);
    } else if (type === "post") {
      router.push(`/posts/${suggestion._id}`);
    }
    setSearchQuery("");
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayPosts = suggestions.posts || [];
  const displayUsers = suggestions.users || [];

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="flex items-center rounded-full border border-neutral-200 bg-neutral-100 px-4 py-2 focus-within:border-cyan-400 dark:border-neutral-700 dark:bg-neutral-900">
        <BsSearch className="text-neutral-500 dark:text-neutral-400" />
        <input
          type="text"
          placeholder="Search for posts, users, hashtags..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch(searchQuery);
            }
          }}
          onFocus={() => setShowDropdown(true)}
          className="ml-3 w-full bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-500 dark:text-neutral-100 dark:placeholder:text-neutral-400"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSuggestions([]);
              setShowDropdown(false);
            }}
            className="ml-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            <MdClose size={20} />
          </button>
        )}
      </div>

      {/* Search Dropdown */}
      {showDropdown && !searchQuery.trim() && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {searchHistory.length === 0 ? (
            <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No recent searches
            </div>
          ) : (
            <div className="p-2">
              <div className="px-2 py-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                RECENT SEARCHES
              </div>
              {searchHistory.map((item) => (
                <button
                  key={item.query}
                  onClick={() => handleSearch(item.query)}
                  className="flex w-full items-center justify-between rounded px-2 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                >
                  <span className="flex items-center gap-2 truncate text-neutral-900 dark:text-neutral-100">
                    <BsSearch className="shrink-0 text-neutral-400" size={12} />
                    {item.query}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => removeHistoryItem(item.query, e)}
                    className="shrink-0 rounded-full p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  >
                    <MdClose size={16} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {showDropdown && searchQuery.trim() && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {isSearching ? (
            <div className="p-2">
              <SearchUserRowSkeletonList count={3} />
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="sticky top-0 flex border-b border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`flex-1 px-4 py-2 text-center font-semibold ${
                    activeTab === "all"
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`flex-1 px-4 py-2 text-center font-semibold ${
                    activeTab === "posts"
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  Posts
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex-1 px-4 py-2 text-center font-semibold ${
                    activeTab === "users"
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}
                >
                  Users
                </button>
              </div>

              {/* Results */}
              <div className="p-2">
                {(activeTab === "all" || activeTab === "posts") &&
                  displayPosts.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        POSTS
                      </div>
                      {displayPosts.map((post) => (
                        <button
                          key={post._id}
                          onClick={() => handleSelectSuggestion(post, "post")}
                          className="w-full truncate rounded px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          <p className="truncate text-neutral-900 dark:text-neutral-100">
                            {post.body}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            by @{post.authorUsername}
                          </p>
                        </button>
                      ))}
                    </>
                  )}

                {(activeTab === "all" || activeTab === "users") &&
                  displayUsers.length > 0 && (
                    <>
                      <div className="px-4 py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        USERS
                      </div>
                      {displayUsers.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => handleSelectSuggestion(user, "user")}
                          className="flex w-full items-center gap-3 rounded px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        >
                          {user.profileImage && (
                            <div className="avatar-square h-8 w-8 overflow-hidden rounded-full">
                              <Image
                                src={user.profileImage}
                                alt={user.username}
                                width={32}
                                height={32}
                                className="h-full w-full rounded-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-neutral-500">
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
                    <div className="p-4 text-center text-sm text-neutral-500 dark:text-neutral-400">
                      No results found
                    </div>
                  )}
              </div>

              {/* Search Button */}
              <div className="border-t border-gray-200 p-2 dark:border-gray-700">
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="w-full rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  Search for "{searchQuery}"
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

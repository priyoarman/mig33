"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BsSearch } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import Link from "next/link";
import Image from "next/image";

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // all, posts, users
  const searchRef = useRef(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setShowDropdown(true);
    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchSuggestions = useCallback(async () => {
    try {
      setIsSearching(true);
      const [postsRes, usersRes] = await Promise.all([
        fetch(`/api/search/posts?q=${encodeURIComponent(searchQuery)}&limit=5`),
        fetch(`/api/search/users?q=${encodeURIComponent(searchQuery)}&limit=5`),
      ]);

      const postsData = await postsRes.json();
      const usersData = await usersRes.json();

      setSuggestions({
        posts: postsData.posts || [],
        users: usersData.users || [],
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSearch = async (query) => {
    if (!query.trim()) return;

    // Save to search history
    try {
      await fetch("/api/search/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, type: "all" }),
      });
    } catch (error) {
      console.error("Error saving search history:", error);
    }

    setSearchQuery("");
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
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
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch(searchQuery);
            }
          }}
          onFocus={() => searchQuery.trim() && setShowDropdown(true)}
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
      {showDropdown && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800">
          {isSearching ? (
            <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
              Searching...
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

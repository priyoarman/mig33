"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { BsSearch } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import { FaHashtag } from "react-icons/fa6";
import PostCard from "./PostCard";
import PostsListClient from "./PostsListClient";
import PostCardSkeletonList from "./skeletons/PostCardSkeleton";
import SearchUserRowSkeletonList from "./skeletons/SearchUserRowSkeleton";
import type { ISearchHistory, PostSummary, SearchUserResult } from "@/types";
import type { TrendingHashtag } from "@/lib/hashtags";

type TabKey = "search" | "trending" | "following";

const TABS: { key: TabKey; label: string }[] = [
  { key: "search", label: "Search" },
  { key: "trending", label: "Trending" },
  { key: "following", label: "For You" },
];

function ExploreSearchTab({ isAuthenticated }: { isAuthenticated: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.trim() || "";

  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [users, setUsers] = useState<SearchUserResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<ISearchHistory[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const loadHistory = useCallback(() => {
    if (!isAuthenticated) return;
    fetch("/api/search/history")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { searchHistory?: ISearchHistory[] } | null) =>
        setSearchHistory(data?.searchHistory || []),
      )
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    if (!query) loadHistory();
  }, [query, loadHistory]);

  useEffect(() => {
    if (!query) {
      setPosts([]);
      setUsers([]);
      abortRef.current?.abort();
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setIsLoading(true);

    (async () => {
      try {
        const [postsRes, usersRes] = await Promise.all([
          fetch(`/api/search/posts?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          }),
          fetch(`/api/search/users?q=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          }),
        ]);
        const postsData = (await postsRes.json()) as { posts?: PostSummary[] };
        const usersData = (await usersRes.json()) as { users?: SearchUserResult[] };
        setPosts(Array.isArray(postsData.posts) ? postsData.posts : []);
        setUsers(Array.isArray(usersData.users) ? usersData.users : []);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("Explore search error:", error);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [query]);

  const goToSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (isAuthenticated) {
      fetch("/api/search/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, type: "all" }),
      })
        .then(() => loadHistory())
        .catch((error) => console.error("Error saving search history:", error));
    }

    router.push(`/explore?tab=search&q=${encodeURIComponent(trimmed)}`);
  };

  const clearSearch = () => {
    router.push("/explore?tab=search");
  };

  const removeHistoryItem = async (value: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSearchHistory((current) => current.filter((item) => item.query !== value));
    try {
      await fetch(`/api/search/history?query=${encodeURIComponent(value)}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error removing search history item:", error);
    }
  };

  if (!query) {
    return (
      <div>
        {isAuthenticated && searchHistory.length > 0 ? (
          <div className="px-2 py-2">
            <div className="text-secondary px-2 py-1 text-xs font-semibold">
              RECENT SEARCHES
            </div>
            {searchHistory.map((item) => (
              <button
                key={item.query}
                onClick={() => goToSearch(item.query)}
                className="hover-accent flex w-full cursor-pointer items-center justify-between rounded-lg px-2 py-3 text-left transition"
              >
                <span className="flex items-center gap-2 truncate text-sm">
                  <BsSearch className="text-muted shrink-0" size={12} />
                  {item.query}
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => removeHistoryItem(item.query, e)}
                  className="text-muted hover:text-primary shrink-0 cursor-pointer rounded-full p-1"
                >
                  <MdClose size={16} />
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex h-96 flex-col items-center justify-center px-4 text-center">
            <BsSearch size={40} className="text-secondary mb-4" />
            <p className="text-xl font-bold">Search using the top-right button</p>
            <p className="text-secondary">
              {isAuthenticated
                ? "Your recent searches will show up here"
                : "Find posts, users, and hashtags"}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="border-default flex items-center gap-2 border-b px-4 py-3">
        <BsSearch className="text-muted h-4 w-4 shrink-0" />
        <p className="text-primary flex-1 truncate text-sm font-semibold">
          {query}
        </p>
        <button
          type="button"
          onClick={clearSearch}
          className="text-muted hover:text-primary shrink-0 cursor-pointer"
        >
          <MdClose size={18} />
        </button>
      </div>

      {isLoading ? (
        <div>
          <PostCardSkeletonList count={3} withImage />
          <SearchUserRowSkeletonList count={3} />
        </div>
      ) : posts.length === 0 && users.length === 0 ? (
        <div className="flex h-96 flex-col items-center justify-center px-4 text-center">
          <BsSearch size={40} className="text-secondary mb-4" />
          <p className="text-xl font-bold">No results found</p>
          <p className="text-secondary">
            Try searching for posts, users, or hashtags
          </p>
        </div>
      ) : (
        <>
          {posts.length > 0 && (
            <div>
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}

          {users.length > 0 && (
            <div className="border-default border-t">
              {users.map((user) => (
                <Link
                  key={user._id}
                  href={`/profile/${user.username}`}
                  className="hover-accent border-default flex items-center gap-4 border-b px-4 py-3 transition"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    {user.profileImage ? (
                      <Image
                        src={user.profileImage}
                        alt={user.username}
                        width={48}
                        height={48}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-bold text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-sm">{user.name}</p>
                    <p className="text-secondary text-sm truncate">@{user.username}</p>
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
    </div>
  );
}

function ExploreTrendingTab({ hashtags }: { hashtags?: TrendingHashtag[] }) {
  if (!hashtags || hashtags.length === 0) {
    return (
      <div className="flex h-96 flex-col items-center justify-center px-4 text-center">
        <FaHashtag size={40} className="text-secondary mb-4" />
        <p className="text-xl font-bold">No trending hashtags yet</p>
        <p className="text-secondary">
          Hashtags will show up here once people start using them.
        </p>
      </div>
    );
  }

  return (
    <div>
      {hashtags.map((item, index) => (
        <Link
          key={item.tag}
          href={`/explore/hashtag/${encodeURIComponent(item.tag)}`}
          className="hover-accent border-default flex items-center gap-3 border-b px-4 py-3 transition"
        >
          <span className="text-secondary w-6 shrink-0 text-sm font-semibold">
            {index + 1}
          </span>
          <p className="truncate font-bold">
            #{item.tag}{" "}
            {/* <span className="text-secondary font-normal">({item.count})</span> */}
          </p>
        </Link>
      ))}
    </div>
  );
}

function ExploreFollowingTab({
  isAuthenticated,
  initialPosts,
  initialHasMore,
  initialCursor,
}: {
  isAuthenticated: boolean;
  initialPosts: PostSummary[];
  initialHasMore: boolean;
  initialCursor: string | null;
}) {
  if (!isAuthenticated) {
    return (
      <div className="flex h-96 flex-col items-center justify-center px-4 text-center">
        <p className="text-xl font-bold">
          Sign in to see posts from people you follow
        </p>
        <Link
          href="/login"
          className="text-accent mt-2 font-semibold hover:underline"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <PostsListClient
      initialPosts={initialPosts}
      initialHasMore={initialHasMore}
      initialCursor={initialCursor}
      endpoint="/api/posts?following=1"
      emptyState={
        <div className="flex h-96 flex-col items-center justify-center px-4 text-center">
          <p className="text-xl font-bold">No posts yet</p>
          <p className="text-secondary">
            Follow people to see their posts here.
          </p>
        </div>
      }
    />
  );
}

type ExplorePageProps = {
  isAuthenticated: boolean;
  trendingHashtags: TrendingHashtag[];
  followingPosts: PostSummary[];
  followingHasMore: boolean;
  followingCursor: string | null;
};

export default function ExplorePage({
  isAuthenticated,
  trendingHashtags,
  followingPosts,
  followingHasMore,
  followingCursor,
}: ExplorePageProps) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((tab) => tab.key === tabFromUrl) ? (tabFromUrl as TabKey) : "trending",
  );

  useEffect(() => {
    if (tabFromUrl && TABS.some((tab) => tab.key === tabFromUrl)) {
      setActiveTab(tabFromUrl as TabKey);
    }
  }, [tabFromUrl]);

  return (
    <div className="reddit-main-column border-default sticky z-10 flex w-full flex-col border-r-1 py-2">
      <div className="flex min-h-screen flex-col">
        <div className="border-default bg-panel bg-opacity-80 sticky top-0 z-10 flex h-14 items-center border-b px-4 backdrop-blur-sm">
          <p className="text-xl font-bold">Explore</p>
        </div>

        <div className="border-default bg-panel bg-opacity-80 sticky top-14 z-10 flex border-b backdrop-blur-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 cursor-pointer px-4 py-3 text-center text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "border-accent text-accent border-b-2"
                  : "text-secondary hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "following" && (
          <ExploreFollowingTab
            isAuthenticated={isAuthenticated}
            initialPosts={followingPosts}
            initialHasMore={followingHasMore}
            initialCursor={followingCursor}
          />
        )}
        {activeTab === "trending" && (
          <ExploreTrendingTab hashtags={trendingHashtags} />
        )}
        {activeTab === "search" && (
          <ExploreSearchTab isAuthenticated={isAuthenticated} />
        )}
      </div>
    </div>
  );
}

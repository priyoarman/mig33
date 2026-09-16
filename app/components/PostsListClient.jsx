"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PostCard from "./PostCard";

export default function PostsListClient({
  initialPosts,
  initialHasMore,
  initialCursor,
  endpoint = "/api/posts",
  emptyState = null,
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore || !cursor) return;
    setLoading(true);
    try {
      const separator = endpoint.includes("?") ? "&" : "?";
      const res = await fetch(
        `${endpoint}${separator}before=${encodeURIComponent(cursor)}`,
      );
      if (!res.ok) return;
      const data = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading, endpoint]);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  if (posts.length === 0) {
    return emptyState;
  }

  return (
    <>
      {posts.map((post) => (
        <PostCard key={post.feedKey || post._id} post={post} />
      ))}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center px-4 py-4">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Show more"}
          </button>
        </div>
      )}
    </>
  );
}

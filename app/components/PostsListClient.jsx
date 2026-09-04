"use client";

import { useState } from "react";
import PostCard from "./PostCard";

const POSTS_PER_PAGE = 7;

export default function PostsListClient({ posts }) {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <>
      {visiblePosts.map((post) => (
        <PostCard key={post._id} post={post} />
      ))}

      {visibleCount < posts.length && (
        <div className="flex justify-center px-4 py-4">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + POSTS_PER_PAGE)}
            className="rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
          >
            Show more
          </button>
        </div>
      )}
    </>
  );
}

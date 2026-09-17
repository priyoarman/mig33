"use client";

import Link from "next/link";
import PostsListClient from "./PostsListClient";

export default function HashtagFeedPage({
  tag,
  initialPosts,
  initialHasMore,
  initialCursor,
}) {
  return (
    <div className="reddit-main-column bg-panel text-primary flex h-screen w-full overflow-hidden">
      <div className="border-default flex w-full flex-1 flex-col border-r">
        <div className="border-default bg-panel bg-opacity-80 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Link href="/explore" className="hover-accent rounded-full p-2 text-2xl">
              ←
            </Link>
            <div className="flex-1">
              <p className="text-xl font-bold">#{tag}</p>
              <p className="text-secondary text-sm">Posts using this hashtag</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <PostsListClient
            initialPosts={initialPosts}
            initialHasMore={initialHasMore}
            initialCursor={initialCursor}
            endpoint={`/api/posts?hashtag=${encodeURIComponent(tag)}`}
            emptyState={
              <div className="flex h-96 flex-col items-center justify-center px-4 text-center">
                <p className="text-xl font-bold">No posts found</p>
                <p className="text-secondary">
                  No one has used #{tag} yet.
                </p>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}

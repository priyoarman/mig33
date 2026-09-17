import { getFeedPage, DEFAULT_FEED_PAGE_SIZE } from "@/lib/posts";
import PostsListClient from "./PostsListClient";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";

export default async function PostsList() {
  const session = await getServerSession(authOptions);
  const { posts, hasMore, nextCursor } = await getFeedPage({
    limit: DEFAULT_FEED_PAGE_SIZE,
    currentUserId: session?.user?.id,
  });

  return (
    <div className="bg-panel z-20 py-2 pb-16 sm:pb-0">
      <PostsListClient
        initialPosts={posts}
        initialHasMore={hasMore}
        initialCursor={nextCursor}
      />
    </div>
  );
}

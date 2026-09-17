import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { getFeedPage, getFollowingIds, DEFAULT_FEED_PAGE_SIZE } from "@/lib/posts";
import { getTrendingHashtags } from "@/lib/hashtags";
import ExplorePage from "../components/ExplorePage";

export const dynamic = "force-dynamic";

const Explore = async () => {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  const [trendingHashtags, following] = await Promise.all([
    getTrendingHashtags(30),
    currentUserId
      ? getFeedPage({
          authorIds: await getFollowingIds(currentUserId),
          currentUserId,
          limit: DEFAULT_FEED_PAGE_SIZE,
        })
      : Promise.resolve({ posts: [], hasMore: false, nextCursor: null }),
  ]);

  return (
    <Suspense fallback={null}>
      <ExplorePage
        isAuthenticated={Boolean(currentUserId)}
        trendingHashtags={trendingHashtags}
        followingPosts={following.posts}
        followingHasMore={following.hasMore}
        followingCursor={following.nextCursor}
      />
    </Suspense>
  );
};

export default Explore;

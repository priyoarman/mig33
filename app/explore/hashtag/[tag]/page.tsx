import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getFeedPage, DEFAULT_FEED_PAGE_SIZE } from "@/lib/posts";
import HashtagFeedPage from "@/app/components/HashtagFeedPage";

export const dynamic = "force-dynamic";

const HashtagPage = async ({
  params,
}: {
  params: Promise<{ tag: string }>;
}) => {
  const { tag: rawTag } = await params;
  const tag = decodeURIComponent(rawTag).toLowerCase();

  const session = await getServerSession(authOptions);
  const { posts, hasMore, nextCursor } = await getFeedPage({
    hashtag: tag,
    currentUserId: session?.user?.id,
    limit: DEFAULT_FEED_PAGE_SIZE,
  });

  return (
    <HashtagFeedPage
      tag={tag}
      initialPosts={posts}
      initialHasMore={hasMore}
      initialCursor={nextCursor}
    />
  );
};

export default HashtagPage;

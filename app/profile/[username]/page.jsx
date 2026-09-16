import OtherUserProfilePage from "@/app/components/OtherUserProfilePage";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";
import { getFeedPage, DEFAULT_FEED_PAGE_SIZE } from "@/lib/posts";
import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";

const serializeConnections = (users = []) =>
  users.filter(Boolean).map((user) => ({
    _id: user._id.toString(),
    name: user.name || "User",
    username: user.username || "username",
    profileImage: user.profileImage || null,
  }));

const OtherProfile = async ({ params }) => {
  const session = await getServerSession(authOptions);
  const { username } = await params;

  if (!username) {
    notFound();
  }

  await connectMongoDB();

  const targetUser = await User.findOne({
    username: username.toLowerCase(),
  })
    .select(
      "_id name username bio website profileImage coverImage followers following createdAt",
    )
    .populate("followers", "_id name username profileImage")
    .populate("following", "_id name username profileImage")
    .lean();

  if (!targetUser) {
    notFound();
  }

  if (
    session?.user?.username &&
    session.user.username.toLowerCase() === username.toLowerCase()
  ) {
    redirect("/profile");
  }

  const [{ posts, hasMore, nextCursor }, currentUser] = await Promise.all([
    getFeedPage({
      authorId: targetUser._id.toString(),
      currentUserId: session?.user?.id,
      limit: DEFAULT_FEED_PAGE_SIZE,
    }),
    session?.user?.id
      ? User.findById(session.user.id).select("following").lean()
      : null,
  ]);

  const isFollowing =
    !!session?.user?.id &&
    !!currentUser &&
    Array.isArray(currentUser.following) &&
    currentUser.following.some(
      (id) => id && id.toString() === targetUser._id.toString(),
    );

  const profileStats = {
    followersCount: Array.isArray(targetUser?.followers)
      ? targetUser.followers.length
      : 0,
    followingCount: Array.isArray(targetUser?.following)
      ? targetUser.following.length
      : 0,
    joinedAt: targetUser?.createdAt ? new Date(targetUser.createdAt) : null,
  };

  const profileUser = {
    _id: targetUser._id.toString(),
    name: targetUser.name || "User",
    username: targetUser.username || username,
    bio: targetUser.bio || "",
    website: targetUser.website || "",
    profileImage: targetUser.profileImage || null,
    coverImage: targetUser.coverImage || null,
  };

  const connections = {
    followers: serializeConnections(targetUser.followers),
    following: serializeConnections(targetUser.following),
  };

  return (
    <OtherUserProfilePage
      posts={posts}
      hasMore={hasMore}
      nextCursor={nextCursor}
      profileUser={profileUser}
      profileStats={profileStats}
      isFollowing={isFollowing}
      connections={connections}
    />
  );
};

export default OtherProfile;

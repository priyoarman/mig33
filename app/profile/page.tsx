import ProfilePage from "../components/ProfilePage";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import User from "@/models/user";
import { getFeedPage, DEFAULT_FEED_PAGE_SIZE } from "@/lib/posts";
import { redirect } from "next/navigation";
import type { Types } from "mongoose";
import type { UserProfile } from "@/types";

type PopulatedConnectionUser = {
  _id: Types.ObjectId;
  name?: string;
  username?: string;
  profileImage?: string | null;
};

type PopulatedProfileUser = {
  name?: string;
  username?: string;
  bio?: string;
  website?: string;
  profileImage?: string | null;
  coverImage?: string | null;
  followers?: PopulatedConnectionUser[];
  following?: PopulatedConnectionUser[];
  createdAt?: Date;
};

const serializeConnections = (
  users: (PopulatedConnectionUser | null | undefined)[] = [],
): UserProfile[] =>
  users
    .filter((user): user is PopulatedConnectionUser => Boolean(user))
    .map((user) => ({
      _id: user._id.toString(),
      name: user.name || "User",
      username: user.username || "username",
      profileImage: user.profileImage || null,
    }));

const Profile = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  await connectMongoDB();

  const [{ posts, hasMore, nextCursor }, currentUser] = await Promise.all([
    getFeedPage({
      authorId: session.user.id,
      currentUserId: session.user.id,
      limit: DEFAULT_FEED_PAGE_SIZE,
    }),
    User.findById(session.user.id)
      .select(
        "name username bio website profileImage coverImage followers following createdAt",
      )
      .populate("followers", "_id name username profileImage")
      .populate("following", "_id name username profileImage")
      .lean() as unknown as Promise<PopulatedProfileUser | null>,
  ]);

  const profileStats = {
    followersCount: Array.isArray(currentUser?.followers)
      ? currentUser.followers.length
      : 0,
    followingCount: Array.isArray(currentUser?.following)
      ? currentUser.following.length
      : 0,
    joinedAt: currentUser?.createdAt ? new Date(currentUser.createdAt) : null,
  };

  const profileUser = currentUser
    ? {
        _id: session.user.id,
        name: currentUser.name || session.user.name || undefined,
        username: currentUser.username || session.user.username,
        bio: currentUser.bio || "",
        website: currentUser.website || "",
        profileImage: currentUser.profileImage || session.user.image || null,
        coverImage: currentUser.coverImage || null,
      }
    : {
        _id: session.user.id,
        name: session.user.name ?? undefined,
        username: session.user.username,
        bio: "",
        website: "",
        profileImage: session.user.image || null,
        coverImage: null,
      };

  const connections = {
    followers: serializeConnections(currentUser?.followers),
    following: serializeConnections(currentUser?.following),
  };

  return (
    <ProfilePage
      posts={posts}
      hasMore={hasMore}
      nextCursor={nextCursor}
      profileUser={profileUser}
      profileStats={profileStats}
      connections={connections}
    />
  );
};

export default Profile;

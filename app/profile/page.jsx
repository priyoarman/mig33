import ProfilePage from "../components/ProfilePage";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import connectMongoDB from "@/lib/mongodb";
import Post from "@/models/posts";
import User from "@/models/user";
import { redirect } from "next/navigation";

const Profile = async () => {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  await connectMongoDB();

  const [rawPosts, currentUser] = await Promise.all([
    Post.find({ authorId: session.user.id })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true }),
    User.findById(session.user.id)
      .select(
        "name username bio website profileImage coverImage followers following createdAt",
      )
      .lean(),
  ]);

  const posts = rawPosts.map((doc) => {
    const likesArray = Array.isArray(doc.likes) ? doc.likes : [];
    return {
      _id: doc._id.toString(),
      body: doc.body,
      images: doc.images || [],
      authorId: doc.authorId,
      authorName: doc.authorName,
      authorUsername: doc.authorUsername,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      likesCount: doc.likesCount ?? likesArray.length,
      likedByMe: session
        ? likesArray.map(String).includes(session.user.id)
        : false,
      commentsCount: doc.commentsCount ?? doc.comments?.length ?? 0,
    };
  });

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
        name: currentUser.name || session.user.name,
        username: currentUser.username || session.user.username,
        bio: currentUser.bio || "",
        website: currentUser.website || "",
        profileImage: currentUser.profileImage || session.user.image || null,
        coverImage: currentUser.coverImage || null,
      }
    : {
        name: session.user.name,
        username: session.user.username,
        bio: "",
        website: "",
        profileImage: session.user.image || null,
        coverImage: null,
      };

  return (
    <ProfilePage
      posts={posts}
      profileUser={profileUser}
      profileStats={profileStats}
    />
  );
};

export default Profile;

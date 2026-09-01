"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { FaLink } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import Link from "next/link";
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
  AiOutlineRetweet,
  AiOutlineEye,
} from "react-icons/ai";
import Image from "next/image";
import ConnectionsModal from "./ConnectionsModal";

const OtherUserProfilePage = ({
  posts,
  profileStats = {},
  profileUser = {},
  isFollowing = false,
  connections = {},
}) => {
  const { data: session } = useSession();
  const [likesCount, setLikesCount] = React.useState({});
  const [liked, setLiked] = React.useState({});
  const [following, setFollowing] = React.useState(isFollowing);
  const [followersCount, setFollowersCount] = React.useState(
    profileStats.followersCount ?? 0,
  );
  const [pending, setPending] = React.useState(false);
  const [connectionsType, setConnectionsType] = React.useState(null);

  const user = {
    id: profileUser?._id || profileUser?.id || "",
    name: profileUser?.name || "User",
    username: profileUser?.username || "username",
    bio: profileUser?.bio || "Here goes my short bio for Y",
    website: profileUser?.website || "",
    profileImage: profileUser?.profileImage || null,
    coverImage: profileUser?.coverImage || null,
  };

  React.useEffect(() => {
    const initialLikes = {};
    const initialLiked = {};
    posts.forEach((post) => {
      initialLikes[post._id] = post.likesCount || 0;
      initialLiked[post._id] = post.likedByMe || false;
    });
    setLikesCount(initialLikes);
    setLiked(initialLiked);
  }, [posts]);

  React.useEffect(() => {
    setFollowing(isFollowing);
    setFollowersCount(profileStats.followersCount ?? 0);
  }, [isFollowing, profileStats.followersCount]);

  const handleLike = async (postId) => {
    const newLiked = !liked[postId];
    setLiked((prev) => ({ ...prev, [postId]: newLiked }));
    setLikesCount((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + (newLiked ? 1 : -1),
    }));

    const res = await fetch(`/api/posts/${postId}/like`, {
      method: "POST",
    });

    if (res.ok) {
      const { liked: newLikedState, likesCount: newCount } = await res.json();
      setLiked((prev) => ({ ...prev, [postId]: newLikedState }));
      setLikesCount((prev) => ({ ...prev, [postId]: newCount }));
    } else {
      setLiked((prev) => ({ ...prev, [postId]: !newLiked }));
      setLikesCount((prev) => ({
        ...prev,
        [postId]: (prev[postId] || 0) + (newLiked ? -1 : 1),
      }));
    }
  };

  const handleFollowToggle = async () => {
    if (!session?.user?.id || !user.id) return;

    setPending(true);

    try {
      const res = await fetch(`/api/users/${user.id}/follow`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Unable to update follow status");
      }

      setFollowing(Boolean(data.following));
      if (typeof data.followersCount === "number") {
        setFollowersCount(data.followersCount);
      }
    } catch (error) {
      console.error("Follow toggle failed:", error);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="reddit-main-column border-default sticky flex w-full flex-col border-r-1">
      <div className="w-full">
        <div className="relative z-0 h-52 w-full overflow-hidden bg-gray-800 text-2xl text-white">
          {user.coverImage ? (
            <>
              <Image
                src={user.coverImage}
                alt={`${user.name || "User"} cover`}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-black/30" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-gray-700 via-gray-600 to-gray-500" />
          )}
        </div>

        <div className="flex h-auto min-h-36 w-full flex-row justify-between gap-3 pt-2">
          <div className="relative z-20 container mt-[-64] ml-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-gray-50 bg-gray-200 text-2xl text-white">
            {user.profileImage ? (
              <div className="relative h-full w-full">
                <Image
                  src={user.profileImage}
                  alt={`${user.name || "User"} avatar`}
                  fill
                  sizes="128px"
                  className="rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-[100%] w-[100%] items-center justify-center bg-cyan-500 text-3xl font-bold text-white">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>

          <div className="relative z-20 flex flex-col gap-2 px-2 py-2">
            {!session?.user?.id ? (
              <Link
                href="/login"
                className="cursor-pointer rounded-full bg-cyan-500 px-4 py-2 text-center text-sm font-semibold text-white text-shadow-xs hover:bg-cyan-600"
              >
                Log in to follow
              </Link>
            ) : session?.user?.id === user.id ? null : (
              <button
                onClick={handleFollowToggle}
                disabled={pending}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-white transition text-shadow-xs disabled:cursor-not-allowed disabled:opacity-60 ${
                  following
                    ? "bg-cyan-500 hover:bg-cyan-600"
                    : "bg-gray-500 hover:bg-cyan-500"
                }`}
              >
                {pending ? "..." : following ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-panel mt-[-72] flex flex-col gap-1 p-4">
        <div className="pb-2">
          <div className="text-primary text-xl font-bold">{user.name}</div>
          <div className="text-primary text-[17px] font-medium">
            @{user.username}
          </div>
        </div>

        <div className="felx-row text-primary flex w-fit text-[16px]">
          {user.bio || "Tell the world a little about yourself."}
        </div>

        <div className="felx-row flex w-fit gap-4 text-[16px]">
          {user.website ? (
            <div className="flex flex-row gap-2">
              <p className="text-muted flex flex-row pt-1">
                <FaLink />
              </p>
              <a
                href={
                  user.website.startsWith("http")
                    ? user.website
                    : `https://${user.website}`
                }
                target="_blank"
                rel="noreferrer"
                className="cursor-pointer text-blue-400 hover:underline"
              >
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            </div>
          ) : null}
          <div className="hidden flex-row gap-2 sm:flex">
            <p className="text-muted flex flex-row pt-1">
              <IoCalendarOutline />
            </p>
            <a className="text-muted cursor-pointer">
              {profileStats.joinedAt
                ? `Joined ${new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    year: "numeric",
                  }).format(new Date(profileStats.joinedAt))}`
                : "Joined recently"}
            </a>
          </div>
        </div>

        <div className="felx-row flex w-fit gap-2 text-[16px] font-medium text-gray-800">
          <button
            type="button"
            onClick={() => setConnectionsType("followers")}
            className="cursor-pointer hover:underline"
          >
            <span className="font-bold">{followersCount}</span> Followers
          </button>
          <button
            type="button"
            onClick={() => setConnectionsType("following")}
            className="cursor-pointer hover:underline"
          >
            <span className="font-bold">
              {profileStats.followingCount ?? 0}
            </span>{" "}
            Following
          </button>
        </div>
      </div>

      <h2 className="text-primary border-default mb-4 border-y-1 px-4 py-4 text-xl font-bold">
        Posts
      </h2>

      {posts.length ? (
        <div className="bg-panel z-20 pb-2">
          {posts.map((post) => (
            <div
              key={post._id}
              className="bg-panel hover-panel z-20 flex w-full flex-row gap-2 border-slate-300 shadow-xs transition-all hover:shadow-sm sm:gap-0"
            >
              <div className="flex w-1/12 flex-col items-start justify-items-start px-4 py-4">
                <div className="flex h-10 w-10 rounded-full bg-neutral-600"></div>
              </div>

              <div className="flex w-11/12 flex-col gap-4 p-4 sm:gap-2">
                <div className="flex h-8 flex-row justify-between p-0">
                  <div className="flex w-full flex-row justify-between gap-2 px-1 sm:pl-0">
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <h2 className="cursor-pointer text-[16px] font-bold text-neutral-700 hover:underline sm:text-lg">
                        {post.authorName}
                      </h2>
                      <h3 className="cursor-pointer text-[16px] font-bold text-neutral-500 sm:text-lg">
                        @{post.authorUsername}
                      </h3>
                    </div>

                    <h4 className="mt-1 text-[12px] text-neutral-400 sm:mt-0.5 sm:text-[16px]">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </h4>
                  </div>
                </div>

                <div>
                  <p className="my-4 px-1 text-lg text-neutral-600 sm:pl-0">
                    {post.body}
                  </p>
                  {post.images && post.images.length > 0 && (
                    <div className="mt-2 overflow-hidden rounded-xl">
                      {post.images.map((image, index) => (
                        <Image
                          key={index}
                          src={image}
                          alt="Post image"
                          width={500}
                          height={300}
                          className="w-full object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-row justify-between px-2 pt-2">
                  <div
                    className={`flex cursor-pointer flex-row justify-center gap-1.5 ${
                      liked[post._id]
                        ? "text-red-600"
                        : "text-muted hover:text-red-600"
                    }`}
                    onClick={() => handleLike(post._id)}
                  >
                    {liked[post._id] ? (
                      <AiFillHeart className="text-lg" />
                    ) : (
                      <AiOutlineHeart className="text-lg" />
                    )}
                    <p className="font-semi text-sm">
                      {likesCount[post._id] || 0}
                    </p>
                  </div>

                  <Link
                    className="text-muted flex cursor-pointer flex-row justify-center gap-1.5 hover:text-blue-500"
                    href={`/posts/${post._id}/comments`}
                  >
                    <AiOutlineComment className="cursor-pointer text-lg font-bold" />
                    <p className="font-semi mt-0.5 flex flex-row text-sm">
                      {post.commentsCount ?? 0}
                    </p>
                  </Link>

                  <div className="text-muted flex cursor-pointer flex-row justify-center gap-1.5 hover:text-green-500">
                    <button className="flex flex-row items-center justify-center justify-items-center">
                      <AiOutlineRetweet className="cursor-pointer text-lg font-bold" />
                    </button>
                    <p className="font-semi mt-0.5 flex flex-row text-sm">0</p>
                  </div>

                  <div className="text-muted flex cursor-pointer flex-row justify-center gap-1.5 hover:text-yellow-500">
                    <button className="flex flex-row items-center justify-center justify-items-center">
                      <AiOutlineEye className="cursor-pointer text-lg font-bold" />
                    </button>
                    <p className="font-semi mt-0.5 flex flex-row text-sm">0</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-primary mx-4 mb-4 text-lg">
          This user hasn&apos;t posted anything yet.
        </p>
      )}

      {connectionsType && (
        <ConnectionsModal
          type={connectionsType}
          users={connections[connectionsType] || []}
          onClose={() => setConnectionsType(null)}
        />
      )}
    </div>
  );
};

export default OtherUserProfilePage;

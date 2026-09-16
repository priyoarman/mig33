"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { FaLink } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import Link from "next/link";
import Image from "next/image";
import ConnectionsModal from "./ConnectionsModal";
import PostsListClient from "./PostsListClient";

const ProfilePage = ({
  posts,
  hasMore = false,
  nextCursor = null,
  profileStats = {},
  profileUser = {},
  connections = {},
}) => {
  const { data: session } = useSession();
  const [connectionsType, setConnectionsType] = React.useState(null);

  const user = {
    name: profileUser?.name || session?.user?.name || "User",
    username: profileUser?.username || session?.user?.username || "username",
    bio: profileUser?.bio || "",
    website: profileUser?.website || "",
    profileImage: profileUser?.profileImage || session?.user?.image || null,
    coverImage: profileUser?.coverImage || null,
  };

  const bioText = user.bio?.trim()
    ? user.bio
    : `${user.name || user.username || "This user"} has not updated his/her bio yet.`;

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
          <div className="avatar-square relative z-20 container mt-[-64] ml-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-gray-50 bg-gray-200 text-2xl text-white">
            {user.profileImage ? (
              <div className="relative h-full w-full overflow-hidden rounded-full">
                <Image
                  src={user.profileImage}
                  alt={`${user.name || "User"} avatar`}
                  fill
                  sizes="128px"
                  className="h-full w-full rounded-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-full bg-cyan-500 text-3xl font-bold text-white">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
          <div className="relative z-20 flex flex-col gap-2 px-2 py-2">
            <button
              onClick={() => signOut()}
              className="cursor-pointer rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white text-shadow-xs hover:bg-red-600"
            >
              Log Out
            </button>
            <Link
              href="/profile/edit"
              className="border-default bg-panel text-primary cursor-pointer rounded-full border px-4 py-2 text-center text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-800"
            >
              Edit Profile
            </Link>
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

        <div
          className={`felx-row flex w-fit text-[16px] ${
            user.bio?.trim() ? "text-primary" : "text-muted"
          }`}
        >
          {bioText}
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
            <span className="font-bold">
              {profileStats.followersCount ?? 0}
            </span>{" "}
            Followers
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

      <div className="bg-panel z-20 pb-2">
        <PostsListClient
          initialPosts={posts}
          initialHasMore={hasMore}
          initialCursor={nextCursor}
          endpoint={`/api/posts?authorId=${encodeURIComponent(profileUser._id || "")}`}
          emptyState={
            <p className="text-primary mx-4 mb-4 text-lg">
              You haven&apos;t posted anything yet.
            </p>
          }
        />
      </div>

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

export default ProfilePage;

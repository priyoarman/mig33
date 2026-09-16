"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import RemoveBtn from "./RemoveBtn";
import RichText from "./RichText";
import EditPostModal from "./EditPostModal";
import { HiOutlinePencilAlt } from "react-icons/hi";
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
  AiOutlineRetweet,
  AiOutlineEye,
} from "react-icons/ai";
import Image from "next/image";
import { formatTimeAgo } from "@/lib/date";

export default function PostCard({ post }) {
  const { data: session } = useSession();
  const router = useRouter();
  const isOwner = session?.user?.id === post.authorId;

  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [liked, setLiked] = useState(post.likedByMe);
  const [isLiking, setIsLiking] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? 0);
  const [reposted, setReposted] = useState(post.repostedByMe || false);
  const [repostsCount, setRepostsCount] = useState(post.repostsCount || 0);
  const [isReposting, setIsReposting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [body, setBody] = useState(post.body);
  const [images, setImages] = useState(post.images || []);

  useEffect(() => {
    setCommentsCount(post.commentsCount ?? post.comments?.length ?? 0);
  }, [post.commentsCount, post.comments]);

  useEffect(() => {
    setBody(post.body);
    setImages(post.images || []);
  }, [post.body, post.images]);

  useEffect(() => {
    document.body.classList.toggle("comments-modal-open", isEditOpen);
    return () => document.body.classList.remove("comments-modal-open");
  }, [isEditOpen]);

  const displayDate = post?.createdAt ? formatTimeAgo(post.createdAt) : "";

  const handleLike = async () => {
    if (!session) {
      alert("Please log in to like posts.");
      return;
    }
    if (isLiking) return;

    setIsLiking(true);
    setLiked(!liked);
    setLikesCount((c) => c + (liked ? -1 : 1));

    try {
      const res = await fetch(`/api/posts/${post._id}/like`, {
        method: "POST",
      });
      if (res.ok) {
        const { liked: newLiked, likesCount: newCount } = await res.json();
        setLiked(newLiked);
        setLikesCount(newCount);
      } else {
        setLiked(liked);
        setLikesCount((c) => c + (liked ? 1 : -1));
      }
    } catch {
      setLiked(liked);
      setLikesCount((c) => c + (liked ? 1 : -1));
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    if (!session) {
      alert("Please log in to repost.");
      return;
    }
    if (isReposting) return;

    setIsReposting(true);
    const previousReposted = reposted;
    setReposted(!previousReposted);
    setRepostsCount((c) => c + (previousReposted ? -1 : 1));

    try {
      const res = await fetch(`/api/posts/${post._id}/repost`, {
        method: "POST",
      });
      if (res.ok) {
        const { reposted: newReposted, repostsCount: newCount } =
          await res.json();
        setReposted(newReposted);
        setRepostsCount(newCount);
      } else {
        setReposted(previousReposted);
        setRepostsCount((c) => c + (previousReposted ? 1 : -1));
      }
    } catch {
      setReposted(previousReposted);
      setRepostsCount((c) => c + (previousReposted ? 1 : -1));
    } finally {
      setIsReposting(false);
    }
  };

  return (
    <>
      <article className="group border-default bg-panel w-full border-b transition-colors hover:bg-[rgba(15,20,25,0.01)]">
        {post.repost && (
          <div className="text-muted flex items-center gap-2 px-4 pt-3 text-xs font-semibold sm:px-5">
            <AiOutlineRetweet className="text-sm" />
            <Link
              href={`/profile/${post.repost.byUsername}`}
              className="hover:underline"
            >
              {post.repost.byUserId === session?.user?.id
                ? "You"
                : post.repost.byName}{" "}
              reposted
            </Link>
          </div>
        )}
        <div className="flex w-full flex-row gap-3 px-3 py-3 sm:gap-3 sm:px-4">
          <Link
            href={`/profile/${post.authorUsername}`}
            className="avatar-square mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-bold text-white sm:h-11 sm:w-11"
          >
            {post.authorImage ? (
              <img
                src={post.authorImage}
                alt={`${post.authorName || "User"} avatar`}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center rounded-full">
                {post.authorName
                  ? post.authorName.charAt(0).toUpperCase()
                  : "U"}
              </span>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5 text-[15px] leading-none sm:text-[15px]">
                <Link
                  href={`/profile/${post.authorUsername}`}
                  className="text-primary truncate font-bold hover:underline"
                >
                  {post.authorName}
                </Link>
                <Link
                  href={`/profile/${post.authorUsername}`}
                  className="text-muted truncate hover:underline"
                >
                  @{post.authorUsername}
                </Link>
                <span className="text-muted">·</span>
                <time className="text-muted shrink-0">{displayDate}</time>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2 text-neutral-500">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(true)}
                    className="rounded-full px-1.5 text-cyan-500 transition-colors hover:bg-cyan-500/10 hover:text-cyan-600"
                    aria-label="Edit post"
                  >
                    <HiOutlinePencilAlt className="text-base" />
                  </button>
                  <div className="text-[16px]">
                    <RemoveBtn id={post._id} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-1.5">
              <p className="text-primary text-[15px] leading-6 break-words whitespace-pre-wrap">
                <RichText
                  text={body}
                  mentionUsernames={post.mentionUsernames}
                />
              </p>

              {images && images.length > 0 && (
                <div className="border-default bg-surface mt-3 max-w-[92%] overflow-hidden rounded-2xl border">
                  {images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt="Post image"
                      width={900}
                      height={560}
                      sizes="(max-width: 768px) 92vw, 560px"
                      className="h-auto w-full object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 pr-8 text-sm text-neutral-500 sm:pr-12">
              <div
                className={`group flex items-center gap-1.5 rounded-full px-1.5 py-1 transition-colors ${liked ? "text-red-600" : "hover:cursor-default hover:bg-red-500/10 hover:text-red-600"}`}
                onClick={handleLike}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:cursor-pointer group-hover:bg-red-500/10">
                  {liked ? (
                    <AiFillHeart className="text-[18px]" />
                  ) : (
                    <AiOutlineHeart className="text-[18px]" />
                  )}
                </span>
                <span className="min-w-[1.5rem] text-[13px] font-medium hover:cursor-default">
                  {likesCount}
                </span>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/posts/${post._id}/comments`)}
                className="group flex items-center gap-1.5 rounded-full px-1.5 py-1 text-neutral-500 transition-colors hover:cursor-default hover:bg-blue-500/10 hover:text-blue-500"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:cursor-pointer group-hover:bg-blue-500/10">
                  <AiOutlineComment className="text-[18px]" />
                </span>
                <span className="min-w-[1.5rem] text-[13px] font-medium">
                  {commentsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={handleRepost}
                className={`group flex items-center gap-1.5 rounded-full px-1.5 py-1 transition-colors ${reposted ? "text-green-600" : "text-neutral-500 hover:cursor-default hover:bg-green-500/10 hover:text-green-500"}`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:cursor-pointer group-hover:bg-green-500/10">
                  <AiOutlineRetweet className="text-[18px]" />
                </span>
                <span className="min-w-[1.5rem] text-[13px] font-medium">
                  {repostsCount}
                </span>
              </button>
            </div>
          </div>
        </div>
      </article>

      <EditPostModal
        post={{ _id: post._id, body, images }}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onUpdated={(updatedPost) => {
          setBody(updatedPost?.body ?? "");
          setImages(updatedPost?.images || []);
          setIsEditOpen(false);
        }}
      />
    </>
  );
}

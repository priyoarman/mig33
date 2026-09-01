"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import RemoveBtn from "./RemoveBtn";
import CommentsSection from "./CommentsSection";
import { HiOutlinePencilAlt } from "react-icons/hi";
import {
  AiOutlineHeart,
  AiFillHeart,
  AiOutlineComment,
  AiOutlineRetweet,
  AiOutlineEye,
} from "react-icons/ai";
import Image from "next/image";

export default function PostCard({ post }) {
  const { data: session } = useSession();
  const isOwner = session?.user?.id === post.authorId;

  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [liked, setLiked] = useState(post.likedByMe);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount ?? 0);
  const [comments, setComments] = useState(post.comments || []);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  useEffect(() => {
    setComments(post.comments || []);
    setCommentsCount(post.commentsCount ?? comments.length ?? 0);
  }, [post.comments, post.commentsCount]);

  useEffect(() => {
    document.body.classList.toggle("comments-modal-open", isCommentsOpen);
    return () => document.body.classList.remove("comments-modal-open");
  }, [isCommentsOpen]);

  useEffect(() => {
    if (!isCommentsOpen || !post?._id) return;

    const loadComments = async () => {
      try {
        const res = await fetch(`/api/posts/${post._id}/comments`);
        if (!res.ok) return;
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load comments:", error);
      }
    };

    loadComments();
  }, [isCommentsOpen, post?._id]);

  let displayDate = "";
  if (post?.createdAt) {
    const createdAt = new Date(post.createdAt);
    const now = new Date();
    const diffMs = now - createdAt;

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays >= 1) {
      displayDate = diffDays === 1 ? "1d ago" : `${diffDays}d ago`;
    } else if (diffHours >= 1) {
      displayDate = `${diffHours}h ago`;
    } else if (diffMinutes >= 1) {
      displayDate = `${diffMinutes}m ago`;
    } else {
      displayDate = "Just now";
    }
  }

  const handleLike = async () => {
    if (!session) {
      alert("Please log in to like posts.");
      return;
    }

    setLiked(!liked);
    setLikesCount((c) => c + (liked ? -1 : 1));

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
  };

  return (
    <>
      <article className="group border-default bg-panel w-full border-b transition-colors hover:bg-[rgba(15,20,25,0.01)]">
        <div className="flex w-full flex-row gap-3 px-3 py-3 sm:gap-3 sm:px-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-bold text-white sm:h-11 sm:w-11">
            {post.authorImage ? (
              <img
                src={post.authorImage}
                alt={`${post.authorName || "User"} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {post.authorName
                  ? post.authorName.charAt(0).toUpperCase()
                  : "U"}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-1.5 text-[15px] leading-none sm:text-[15px]">
                <Link
                  href={`/profile/${post.authorUsername}`}
                  className="truncate font-bold text-neutral-800 hover:underline dark:text-neutral-100"
                >
                  {post.authorName}
                </Link>
                <Link
                  href={`/profile/${post.authorUsername}`}
                  className="truncate text-neutral-500 hover:underline dark:text-neutral-400"
                >
                  @{post.authorUsername}
                </Link>
                <span className="text-neutral-500 dark:text-neutral-400">
                  ·
                </span>
                <time className="shrink-0 text-neutral-500 dark:text-neutral-400">
                  {displayDate}
                </time>
              </div>

              {isOwner && (
                <div className="flex items-center gap-2 text-neutral-500">
                  <Link
                    className="rounded-full p-1.5 text-cyan-500 transition-colors hover:bg-cyan-500/10 hover:text-cyan-600"
                    href={`/editPost/${post._id}`}
                    aria-label="Edit post"
                  >
                    <HiOutlinePencilAlt className="text-base" />
                  </Link>
                  <div className="text-[16px]">
                    <RemoveBtn id={post._id} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-1.5">
              <p className="text-[15px] leading-6 break-words whitespace-pre-wrap text-neutral-700 dark:text-neutral-200">
                {post.body}
              </p>

              {post.images && post.images.length > 0 && (
                <div className="mt-3 max-w-[92%] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                  {post.images.map((image, index) => (
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

            <div className="mt-3 flex items-center justify-between gap-2 text-sm text-neutral-500">
              <div
                className={`group flex items-center gap-1.5 rounded-full px-1.5 py-1 transition-colors ${liked ? "text-red-600" : "hover:bg-red-500/10 hover:text-red-600"}`}
                onClick={handleLike}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-red-500/10">
                  {liked ? (
                    <AiFillHeart className="text-[18px]" />
                  ) : (
                    <AiOutlineHeart className="text-[18px]" />
                  )}
                </span>
                <span className="min-w-[1.5rem] text-[13px] font-medium">
                  {likesCount}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsCommentsOpen(true)}
                className="group flex items-center gap-1.5 rounded-full px-1.5 py-1 text-neutral-500 transition-colors hover:bg-blue-500/10 hover:text-blue-500"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-blue-500/10">
                  <AiOutlineComment className="text-[18px]" />
                </span>
                <span className="min-w-[1.5rem] text-[13px] font-medium">
                  {commentsCount}
                </span>
              </button>

              <div className="group flex items-center gap-1.5 rounded-full px-1.5 py-1 text-neutral-500 transition-colors hover:bg-green-500/10 hover:text-green-500">
                <button className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-green-500/10">
                  <AiOutlineRetweet className="text-[18px]" />
                </button>
                <span className="min-w-[1.5rem] text-[13px] font-medium">
                  0
                </span>
              </div>

              <div className="group flex items-center gap-1.5 rounded-full px-1.5 py-1 text-neutral-500 transition-colors hover:bg-yellow-500/10 hover:text-yellow-500">
                <button className="flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-yellow-500/10">
                  <AiOutlineEye className="text-[18px]" />
                </button>
                <span className="min-w-[1.5rem] text-[13px] font-medium">
                  0
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>

      {isCommentsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setIsCommentsOpen(false)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                {`${post.authorName || "User"}'s Post`}
              </h2>
              <button
                type="button"
                onClick={() => setIsCommentsOpen(false)}
                aria-label="Close post view"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4 fill-current"
                  aria-hidden="true"
                >
                  <path d="M18.3 5.71a1 1 0 0 0-1.41-1.41L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.89 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 1 0 1.41-1.41L13.41 12l4.89-4.89Z" />
                </svg>
              </button>
            </div>

            <div className="max-h-[calc(90vh-4.5rem)] overflow-y-auto">
              <div className="border-b border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
                <div className="flex items-center gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-200 text-sm font-bold text-white sm:h-11 sm:w-11">
                    {post.authorImage ? (
                      <img
                        src={post.authorImage}
                        alt={`${post.authorName || "User"} avatar`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>
                        {post.authorName
                          ? post.authorName.charAt(0).toUpperCase()
                          : "U"}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <span className="truncate font-bold text-neutral-800 dark:text-neutral-100">
                        {post.authorName}
                      </span>
                      <span>@{post.authorUsername}</span>
                      <span>·</span>
                      <span>{displayDate}</span>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-[15px] leading-6 break-words whitespace-pre-wrap text-neutral-700 dark:text-neutral-200">
                  {post.body}
                </p>

                {post.images && post.images.length > 0 && (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900">
                    {post.images.map((image, index) => (
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

              <div className="bg-white dark:bg-neutral-950">
                <CommentsSection
                  postId={post._id}
                  initialComments={comments}
                  onCommentAdded={(newComment) => {
                    setComments((prev) => [...prev, newComment]);
                    setCommentsCount((count) => count + 1);
                  }}
                  onCommentDeleted={() => {
                    setCommentsCount((count) => Math.max(0, count - 1));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import CommentsSection from "./CommentsSection";
import { formatTimeAgo } from "@/lib/date";
import type { CommentListItem, PostSummary } from "@/types";

type PostCommentsModalPost = Pick<
  PostSummary,
  "_id" | "authorName" | "authorUsername" | "authorImage" | "body" | "images" | "createdAt"
> & {
  comments?: CommentListItem[];
};

type PostCommentsModalProps = {
  post: PostCommentsModalPost;
};

export default function PostCommentsModal({ post }: PostCommentsModalProps) {
  const router = useRouter();
  const close = () => router.back();

  useEffect(() => {
    document.body.classList.add("comments-modal-open");
    return () => document.body.classList.remove("comments-modal-open");
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const displayDate = post?.createdAt ? formatTimeAgo(post.createdAt) : "";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
      onClick={close}
    >
      <div
        className="border-default bg-panel relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-default flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-primary text-lg font-semibold">
            {`${post.authorName || "User"}'s Post`}
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close post view"
            className="border-default hover-panel text-muted hover:text-primary flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition"
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
          <div className="border-default bg-surface border-b p-4">
            <div className="flex items-center gap-3">
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
                <div className="text-muted flex items-center gap-2 text-sm">
                  <span className="text-primary truncate font-bold">
                    {post.authorName}
                  </span>
                  <span>@{post.authorUsername}</span>
                  <span>·</span>
                  <span>{displayDate}</span>
                </div>
              </div>
            </div>

            <p className="text-primary mt-3 text-[15px] leading-6 break-words whitespace-pre-wrap">
              {post.body}
            </p>

            {post.images && post.images.length > 0 && (
              <div className="border-default bg-surface mt-3 overflow-hidden rounded-2xl border">
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

          <div className="bg-panel">
            <CommentsSection postId={post._id} initialComments={post.comments} />
          </div>
        </div>
      </div>
    </div>
  );
}

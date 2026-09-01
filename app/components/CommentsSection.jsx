"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FiTrash2 } from "react-icons/fi";
import { HiOutlinePencilAlt } from "react-icons/hi";

export default function CommentsSection({
  postId,
  initialComments = [],
  onCommentAdded,
  onCommentDeleted,
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleAdd = async () => {
    if (!session) {
      alert("Log in to comment.");
      return;
    }
    if (!newComment.trim()) {
      alert("Write something to comment!");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: newComment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Comment API error:", res.status, err);
        return;
      }
      const data = await res.json();
      const freshComment = {
        id: data.latestComment._id,
        userId: data.latestComment.user,
        name: data.latestComment.name,
        username: data.latestComment.username,
        email: data.latestComment.email,
        profileImage: data.latestComment.profileImage,
        body: data.latestComment.body,
        createdAt: data.latestComment.createdAt,
      };
      setComments((c) => [...c, freshComment]);
      onCommentAdded?.(freshComment);
      setNewComment("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert("Failed to delete comment");
        return;
      }
      setComments((c) => c.filter((comment) => comment.id !== commentId));
      onCommentDeleted?.(commentId);
    } catch (e) {
      console.error(e);
      alert("Error deleting comment");
    }
  };

  return (
    <div className="bg-surface z-10 flex w-full flex-row gap-1 pb-8 shadow-md transition-all hover:shadow-lg sm:gap-0">
      <div className="flex w-full flex-col">
        <div className="space-y-3">
          {comments.length === 0 ? (
            <div className="px-4 py-6 text-sm text-neutral-500">
              No comments yet. Start the conversation.
            </div>
          ) : (
            comments.map((c) => (
              <div
                key={c.id}
                className="border-default flex w-full flex-row gap-2 border p-2 pl-4 text-[16px]"
              >
                <div className="flex-shrink-0 pt-1">
                  {c.profileImage ? (
                    <img
                      src={c.profileImage}
                      alt={`${c.name} avatar`}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-600 text-xs font-bold text-white">
                      {c.name ? c.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>

                <div className="flex w-full flex-col">
                  <div className="flex flex-row justify-between gap-2">
                    <div className="flex flex-col sm:flex-row sm:gap-2">
                      <p className="text-primary flex font-semibold">
                        {c.name}
                      </p>
                      <p className="text-muted flex font-semibold">
                        @{c.username || "user"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                      {session?.user?.id === c.userId && (
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              alert("Edit comment feature coming soon")
                            }
                            className="cursor-pointer text-cyan-500 hover:text-cyan-600"
                            title="Edit comment"
                          >
                            <HiOutlinePencilAlt size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            className="cursor-pointer text-red-500 hover:text-red-600"
                            title="Delete comment"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="flex py-4 break-words whitespace-pre-wrap">
                    {c.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4">
          <textarea
            className="border-default bg-surface h-24 w-full resize-none border-b-1 px-4 py-4 outline-0 placeholder:font-medium"
            rows={3}
            placeholder="Write a comment…"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={saving}
          />
          <button
            className="mx-2 my-2 h-10 cursor-pointer rounded-3xl bg-gray-500 px-4 text-sm font-bold text-white hover:bg-cyan-500"
            onClick={handleAdd}
            disabled={saving}
          >
            {saving ? "Posting…" : "Comment"}
          </button>
        </div>
      </div>
    </div>
  );
}

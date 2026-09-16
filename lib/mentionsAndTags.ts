import Hashtag from "@/models/hashtag";
import User from "@/models/user";
import { extractHashtags, extractMentionHandles } from "@/lib/entities";
import { createAndEmitNotification } from "@/lib/realtime";
import { snippet } from "@/lib/text";
import type { Types } from "mongoose";

interface MentionActor {
  name: string;
  username?: string | null;
  profileImage?: string | null;
}

/**
 * Increments the usage count for any hashtag in `newBody` that wasn't
 * already present in `previousBody` (a no-op create passes previousBody as
 * null), so editing a post without touching its hashtags doesn't inflate
 * their counts.
 */
export async function recordNewHashtags(
  newBody: string | null | undefined,
  previousBody: string | null | undefined = null,
): Promise<void> {
  const previousTags = new Set(extractHashtags(previousBody));
  const newTags = extractHashtags(newBody).filter(
    (tag) => !previousTags.has(tag),
  );
  if (newTags.length === 0) return;

  await Promise.all(
    newTags.map((tag) =>
      Hashtag.findOneAndUpdate(
        { tag },
        { $inc: { count: 1 } },
        { upsert: true },
      ),
    ),
  );
}

/**
 * Resolves the @handles in `body` to real users, returning their ids for
 * storage on the post/comment `mentions` field.
 */
export async function resolveMentions(
  body: string | null | undefined,
): Promise<{ id: Types.ObjectId; username: string }[]> {
  const handles = extractMentionHandles(body);
  if (handles.length === 0) return [];

  const users = await User.find({ username: { $in: handles } })
    .select("_id username")
    .lean();
  return users.map((user) => ({ id: user._id, username: user.username }));
}

interface NotifyNewMentionsOptions {
  mentionedUsers: { id: Types.ObjectId; username: string }[];
  previouslyMentionedIds?: (string | Types.ObjectId)[];
  authorId: string;
  actor: MentionActor;
  postId: string;
  postBody?: string | null;
  context: "post" | "comment";
}

/**
 * Notifies each newly-mentioned user (skipping the author and anyone who
 * was already mentioned before this edit).
 */
export async function notifyNewMentions({
  mentionedUsers,
  previouslyMentionedIds = [],
  authorId,
  actor,
  postId,
  postBody,
  context,
}: NotifyNewMentionsOptions): Promise<void> {
  const alreadyMentioned = new Set(previouslyMentionedIds.map(String));
  const message =
    context === "post" ? "mentioned you in a post." : "mentioned you in a comment.";

  await Promise.all(
    mentionedUsers
      .filter(
        (user) =>
          user.id.toString() !== authorId &&
          !alreadyMentioned.has(user.id.toString()),
      )
      .map((user) =>
        createAndEmitNotification(user.id.toString(), {
          type: "mention",
          message,
          actorId: authorId,
          actor,
          postId,
          postSnippet: snippet(postBody),
        }),
      ),
  );
}

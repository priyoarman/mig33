import PostCommentsModal from "@/app/components/PostCommentsModal";
import { getPostWithComments } from "@/app/posts/[id]/getPost";

export default async function InterceptedPostCommentsModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostWithComments(id);

  if (!post) return null;

  return <PostCommentsModal post={post} />;
}

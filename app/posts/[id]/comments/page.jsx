import Feed from "@/app/components/Feed";
import PostCommentsModal from "@/app/components/PostCommentsModal";
import { getPostWithComments } from "../getPost";
import { notFound } from "next/navigation";

export default async function CommentsPage({ params }) {
  const { id } = await params;
  const post = await getPostWithComments(id);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Feed />
      <PostCommentsModal post={post} />
    </>
  );
}

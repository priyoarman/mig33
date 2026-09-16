import CommentsSection from "@/app/components/CommentsSection";
import PostCard from "@/app/components/PostCard";
import { getPostWithComments } from "../getPost";

export default async function CommentsPage({ params }) {
  const { id } = await params;
  const post = await getPostWithComments(id);

  if (!post) {
    return <p className="p-4">Post not found.</p>;
  }

  return (
    <div className="sticky z-10 container flex flex-col border-r-1 border-gray-200 py-2 md:w-2/4">
      <p className="flex px-4 py-4 font-bold text-gray-700">Comments</p>
      <PostCard post={post} />
      <CommentsSection postId={post._id} initialComments={post.comments} />
    </div>
  );
}

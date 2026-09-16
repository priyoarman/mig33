import Feed from "@/app/components/Feed";
import PostCommentsModal from "@/app/components/PostCommentsModal";
import { getPostWithComments } from "../getPost";

export default async function CommentsPage({ params }) {
  const { id } = await params;
  const post = await getPostWithComments(id);

  return (
    <>
      <Feed />
      {post ? (
        <PostCommentsModal post={post} />
      ) : (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
          <p className="border-default bg-panel text-primary rounded-2xl border p-6 shadow-2xl">
            Post not found.
          </p>
        </div>
      )}
    </>
  );
}

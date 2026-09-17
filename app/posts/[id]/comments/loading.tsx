import AddPostSkeleton from "@/app/components/skeletons/AddPostSkeleton";
import PostCardSkeletonList, {
  PostCardSkeleton,
} from "@/app/components/skeletons/PostCardSkeleton";
import CommentRowSkeletonList from "@/app/components/skeletons/CommentRowSkeleton";
import Skeleton from "@/app/components/skeletons/Skeleton";

export default function Loading() {
  return (
    <>
      <div className="reddit-main-column border-default sticky z-10 flex w-full flex-col border-r-1 py-2">
        <AddPostSkeleton />
        <PostCardSkeletonList count={5} withImage />
      </div>

      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]">
        <div className="border-default bg-panel relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl">
          <div className="border-default border-b px-4 py-3">
            <Skeleton className="h-5 w-40 rounded" />
          </div>
          <div className="max-h-[calc(90vh-4.5rem)] overflow-y-auto">
            <PostCardSkeleton withImage />
            <div className="px-2 py-4">
              <CommentRowSkeletonList count={4} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

import Skeleton from "../../../components/skeletons/Skeleton";
import { PostCardSkeleton } from "../../../components/skeletons/PostCardSkeleton";
import CommentRowSkeletonList from "../../../components/skeletons/CommentRowSkeleton";

export default function Loading() {
  return (
    <div className="sticky z-10 container flex flex-col border-r-1 border-gray-200 py-2 md:w-2/4">
      <Skeleton className="mx-4 my-4 h-5 w-24 rounded" />
      <PostCardSkeleton withImage />
      <div className="px-2 py-4">
        <CommentRowSkeletonList count={4} />
      </div>
    </div>
  );
}

import Skeleton from "../components/skeletons/Skeleton";
import PostCardSkeletonList from "../components/skeletons/PostCardSkeleton";

export default function Loading() {
  return (
    <div className="reddit-main-column bg-panel text-primary flex h-screen w-full overflow-hidden">
      <div className="border-default flex w-full flex-1 flex-col border-r">
        <div className="border-default bg-panel border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-5 w-20 rounded" />
              <Skeleton className="h-3.5 w-32 rounded" />
            </div>
          </div>
        </div>
        <div className="border-default flex border-b">
          <Skeleton className="m-2 h-8 flex-1 rounded" />
          <Skeleton className="m-2 h-8 flex-1 rounded" />
          <Skeleton className="m-2 h-8 flex-1 rounded" />
        </div>
        <PostCardSkeletonList count={4} withImage />
      </div>
    </div>
  );
}

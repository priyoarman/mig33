import Skeleton from "../components/skeletons/Skeleton";
import NotificationRowSkeletonList from "../components/skeletons/NotificationRowSkeleton";

export default function Loading() {
  return (
    <div className="reddit-main-column sticky z-10 flex w-full flex-col border-r-1 border-gray-200 py-2">
      <div className="flex min-h-screen flex-col pb-4">
        <div className="border-default bg-panel sticky top-0 z-10 border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-6 w-36 rounded" />
          </div>
        </div>
        <NotificationRowSkeletonList count={8} />
      </div>
    </div>
  );
}

import Skeleton from "./Skeleton";

export default function AddPostSkeleton() {
  return (
    <div className="border-default bg-panel flex w-full flex-col gap-3 border-b px-3 py-3 sm:px-4">
      <div className="flex gap-3">
        <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
        <Skeleton className="h-16 flex-1 rounded-2xl" />
      </div>
      <div className="flex items-center justify-between pl-14">
        <div className="flex gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

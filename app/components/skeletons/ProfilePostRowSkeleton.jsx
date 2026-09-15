import Skeleton from "./Skeleton";

function ProfilePostRow() {
  return (
    <div className="bg-panel flex w-full flex-row gap-2 sm:gap-0">
      <div className="flex w-1/12 flex-col items-start px-4 py-4">
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>

      <div className="flex w-11/12 flex-col gap-4 p-4 sm:gap-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-4 w-20 rounded" />
          </div>
          <Skeleton className="h-3 w-14 rounded" />
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/5 rounded" />
        </div>

        <div className="flex flex-row justify-between px-2 pt-2">
          <Skeleton className="h-5 w-10 rounded" />
          <Skeleton className="h-5 w-10 rounded" />
          <Skeleton className="h-5 w-10 rounded" />
          <Skeleton className="h-5 w-10 rounded" />
        </div>
      </div>
    </div>
  );
}

export default function ProfilePostRowSkeletonList({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <ProfilePostRow key={index} />
      ))}
    </>
  );
}

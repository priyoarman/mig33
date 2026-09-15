import Skeleton from "./Skeleton";

function NotificationRow() {
  return (
    <div className="flex items-start gap-3 border-b-1 border-gray-200 px-4 py-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-3/4 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </div>
  );
}

export default function NotificationRowSkeletonList({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <NotificationRow key={index} />
      ))}
    </>
  );
}

import Skeleton from "./Skeleton";

function SuggestedUserRow() {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3.5 w-24 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
      <Skeleton className="h-8 w-20 shrink-0 rounded-full" />
    </div>
  );
}

export default function SuggestedUserRowSkeletonList({ count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, index) => (
        <SuggestedUserRow key={index} />
      ))}
    </div>
  );
}

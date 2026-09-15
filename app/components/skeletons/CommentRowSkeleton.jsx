import Skeleton from "./Skeleton";

function CommentRow() {
  return (
    <div className="border-default flex w-full flex-row gap-2 border p-2 pl-4">
      <Skeleton className="mt-1 h-8 w-8 shrink-0 rounded-full" />
      <div className="flex w-full flex-col gap-2 py-1">
        <div className="flex gap-2">
          <Skeleton className="h-3.5 w-20 rounded" />
          <Skeleton className="h-3.5 w-16 rounded" />
        </div>
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>
    </div>
  );
}

export default function CommentRowSkeletonList({ count = 3 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <CommentRow key={index} />
      ))}
    </div>
  );
}

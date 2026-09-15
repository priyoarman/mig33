import Skeleton from "./Skeleton";

function NewsRow() {
  return (
    <div className="flex items-center justify-between space-x-1 px-4 py-2">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-4/5 rounded" />
        <Skeleton className="h-3 w-1/3 rounded" />
      </div>
      <Skeleton className="h-[52px] w-[70px] shrink-0 rounded-xl" />
    </div>
  );
}

export default function NewsRowSkeletonList({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <NewsRow key={index} />
      ))}
    </>
  );
}

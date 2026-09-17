import Skeleton from "./Skeleton";

function SearchUserRow() {
  return (
    <div className="border-default flex items-center gap-4 border-b px-4 py-3">
      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    </div>
  );
}

type SearchUserRowSkeletonListProps = {
  count?: number;
};

export default function SearchUserRowSkeletonList({
  count = 3,
}: SearchUserRowSkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SearchUserRow key={index} />
      ))}
    </>
  );
}

export { SearchUserRow };

import Skeleton from "./Skeleton";

type PostCardSkeletonProps = {
  withImage?: boolean;
};

function PostCardSkeleton({ withImage = false }: PostCardSkeletonProps) {
  return (
    <article className="border-default bg-panel w-full border-b">
      <div className="flex w-full flex-row gap-3 px-3 py-3 sm:gap-3 sm:px-4">
        <Skeleton className="mt-0.5 h-10 w-10 shrink-0 rounded-full sm:h-11 sm:w-11" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-3.5 w-10 rounded" />
          </div>

          <div className="mt-2.5 space-y-2">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-4/5 rounded" />
          </div>

          {withImage && (
            <Skeleton className="mt-3 h-56 w-[92%] rounded-2xl" />
          )}

          <div className="mt-4 flex items-center justify-between gap-2 pr-8 sm:pr-12">
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      </div>
    </article>
  );
}

type PostCardSkeletonListProps = {
  count?: number;
  withImage?: boolean;
};

export default function PostCardSkeletonList({
  count = 3,
  withImage = false,
}: PostCardSkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} withImage={withImage && index === 0} />
      ))}
    </>
  );
}

export { PostCardSkeleton };

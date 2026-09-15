import Skeleton from "./Skeleton";

export default function ProfileHeaderSkeleton() {
  return (
    <>
      <div className="w-full">
        <Skeleton className="h-52 w-full rounded-none" />

        <div className="flex h-auto min-h-36 w-full flex-row justify-between gap-3 pt-2">
          <div className="relative z-20 mt-[-64px] ml-6">
            <Skeleton className="h-32 w-32 rounded-full border-4 border-gray-50 dark:border-neutral-950" />
          </div>
          <div className="relative z-20 flex flex-col gap-2 px-2 py-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-[-72px] flex flex-col gap-3 p-4">
        <div className="space-y-2 pb-2 pt-16">
          <Skeleton className="h-5 w-40 rounded" />
          <Skeleton className="h-4 w-28 rounded" />
        </div>
        <Skeleton className="h-4 w-full max-w-md rounded" />
        <Skeleton className="h-4 w-24 rounded" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
      </div>

      <div className="border-default border-y-1 px-4 py-4">
        <Skeleton className="h-5 w-16 rounded" />
      </div>
    </>
  );
}

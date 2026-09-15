import Skeleton from "../../components/skeletons/Skeleton";

export default function Loading() {
  return (
    <div className="reddit-main-column sticky z-10 flex w-full flex-col border-r-1 border-gray-200 py-2">
      <div className="mb-6 flex flex-col gap-2 border-b-1 border-gray-200 px-4 py-4">
        <Skeleton className="h-24 w-full rounded" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-10 w-24 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

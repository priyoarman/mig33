import Skeleton from "../components/skeletons/Skeleton";

export default function Loading() {
  return (
    <div className="reddit-main-column sticky z-10 flex h-screen w-full flex-col items-center justify-center gap-3 border-r-1 border-gray-200 py-4">
      <Skeleton className="h-7 w-56 rounded" />
      <Skeleton className="h-5 w-72 rounded" />
    </div>
  );
}

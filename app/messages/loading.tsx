import Skeleton from "../components/skeletons/Skeleton";
import ConversationRowSkeletonList from "../components/skeletons/ConversationRowSkeleton";

export default function Loading() {
  return (
    <div className="bg-panel text-primary flex min-h-screen w-full flex-col border-r border-gray-200">
      <header className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
        <Skeleton className="h-7 w-32 rounded" />
      </header>
      <section className="mx-auto w-full max-w-2xl px-4 py-5">
        <Skeleton className="h-11 w-full rounded-full" />
        <div className="mt-4">
          <ConversationRowSkeletonList count={6} />
        </div>
      </section>
    </div>
  );
}

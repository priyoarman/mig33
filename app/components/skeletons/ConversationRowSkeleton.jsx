import Skeleton from "./Skeleton";

function ConversationRow() {
  return (
    <div className="flex w-full items-center gap-3 px-3 py-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-28 rounded" />
        <Skeleton className="h-3 w-44 rounded" />
      </div>
      <Skeleton className="h-3 w-10 shrink-0 rounded" />
    </div>
  );
}

export default function ConversationRowSkeletonList({ count = 6 }) {
  return (
    <div className="divide-y divide-gray-200">
      {Array.from({ length: count }).map((_, index) => (
        <ConversationRow key={index} />
      ))}
    </div>
  );
}

export function MessageBubbleSkeletonList({ count = 5 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`flex ${index % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Skeleton
            className={`h-9 rounded-2xl ${index % 3 === 0 ? "w-1/2" : "w-1/3"}`}
          />
        </div>
      ))}
    </>
  );
}

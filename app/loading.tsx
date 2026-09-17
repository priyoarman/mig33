import AddPostSkeleton from "./components/skeletons/AddPostSkeleton";
import PostCardSkeletonList from "./components/skeletons/PostCardSkeleton";

export default function Loading() {
  return (
    <div className="reddit-main-column border-default sticky z-10 flex w-full flex-col border-r-1 py-2">
      <AddPostSkeleton />
      <PostCardSkeletonList count={5} withImage />
    </div>
  );
}

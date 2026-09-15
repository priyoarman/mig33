import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import ProfilePostRowSkeletonList from "../../components/skeletons/ProfilePostRowSkeleton";

export default function Loading() {
  return (
    <div className="reddit-main-column border-default sticky flex w-full flex-col border-r-1">
      <ProfileHeaderSkeleton />
      <ProfilePostRowSkeletonList count={3} />
    </div>
  );
}

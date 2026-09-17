import Skeleton from "./Skeleton";
import { FormFieldSkeleton } from "./FormFieldSkeleton";

export default function EditProfileFormSkeleton() {
  return (
    <div className="bg-panel text-primary min-h-screen w-full">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="mx-auto max-w-xl space-y-5 px-4 py-6">
        <div className="-mt-16">
          <Skeleton className="h-24 w-24 rounded-full border-4 border-gray-50 dark:border-neutral-950" />
        </div>
        <FormFieldSkeleton labelWidth="w-16" />
        <FormFieldSkeleton labelWidth="w-12" inputHeight="h-24" />
        <FormFieldSkeleton labelWidth="w-20" />
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>
    </div>
  );
}

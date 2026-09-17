import Skeleton from "./Skeleton";

type FormFieldSkeletonProps = {
  labelWidth?: string;
  inputHeight?: string;
};

export function FormFieldSkeleton({
  labelWidth = "w-20",
  inputHeight = "h-11",
}: FormFieldSkeletonProps) {
  return (
    <div className="space-y-2">
      <Skeleton className={`h-3.5 ${labelWidth} rounded`} />
      <Skeleton className={`w-full ${inputHeight} rounded-lg`} />
    </div>
  );
}

type FormSkeletonProps = {
  fields?: number;
};

export default function FormSkeleton({ fields = 4 }: FormSkeletonProps) {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-8">
      {Array.from({ length: fields }).map((_, index) => (
        <FormFieldSkeleton key={index} />
      ))}
      <Skeleton className="h-11 w-full rounded-full" />
    </div>
  );
}

import FormSkeleton from "../components/skeletons/FormFieldSkeleton";

export default function Loading() {
  return (
    <div className="bg-panel flex min-h-screen w-full items-center justify-center">
      <FormSkeleton fields={4} />
    </div>
  );
}

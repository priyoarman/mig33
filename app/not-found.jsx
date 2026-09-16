import Link from "next/link";

export default function NotFound() {
  return (
    <div className="reddit-main-column border-default flex min-h-screen w-full flex-col items-center justify-center border-r-1 px-4 py-2 text-center">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-medium">404</h1>
        <div className="h-6 w-px bg-gray-300" />
        <p className="text-base">This page could not be found.</p>
      </div>
      <Link
        href="/"
        className="hover-accent border-default mt-6 rounded-full border px-4 py-2 font-semibold"
      >
        Go home
      </Link>
    </div>
  );
}

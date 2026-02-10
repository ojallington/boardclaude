import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h2 className="text-2xl font-bold text-gray-100">Page not found</h2>
      <p className="mt-2 text-sm text-gray-400">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
      >
        Go home
      </Link>
    </div>
  );
}

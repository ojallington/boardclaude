export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading page content">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-indigo-500" aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

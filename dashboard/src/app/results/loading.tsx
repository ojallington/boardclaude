export default function ResultsLoading() {
  return (
    <main
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading audit results"
    >
      <div className="mb-8 space-y-2">
        <div className="h-4 w-16 animate-pulse rounded bg-gray-800" />
        <div className="h-8 w-48 animate-pulse rounded bg-gray-800" />
        <div className="h-4 w-32 animate-pulse rounded bg-gray-800" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-gray-800 bg-gray-900/60"
          />
        ))}
      </div>
    </main>
  );
}

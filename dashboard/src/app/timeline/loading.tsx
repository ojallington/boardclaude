export default function TimelineLoading() {
  return (
    <main
      className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading timeline"
    >
      <div className="mb-10 space-y-2">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-800" />
        <div className="h-4 w-72 animate-pulse rounded bg-gray-800" />
      </div>
      <div className="mb-10 h-24 animate-pulse rounded-xl border border-gray-800 bg-gray-900/60" />
      <div className="space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="ml-14 h-32 animate-pulse rounded-xl border border-gray-800 bg-gray-900/60 sm:ml-20"
          />
        ))}
      </div>
    </main>
  );
}

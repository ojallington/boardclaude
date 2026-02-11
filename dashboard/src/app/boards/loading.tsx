export default function BoardsLoading() {
  return (
    <main
      className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading panel templates"
    >
      <div className="mb-10 space-y-2 text-center">
        <div className="mx-auto h-8 w-48 animate-pulse rounded bg-gray-800" />
        <div className="mx-auto h-4 w-80 animate-pulse rounded bg-gray-800" />
      </div>
      <div className="mb-8 h-52 animate-pulse rounded-xl border border-gray-800 bg-gray-900/60" />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-xl border border-gray-800 bg-gray-900/60"
          />
        ))}
      </div>
    </main>
  );
}

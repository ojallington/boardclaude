export default function AuditDetailLoading() {
  return (
    <main
      className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading audit detail"
    >
      <div className="mb-8 h-4 w-32 animate-pulse rounded bg-gray-800" />
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-40 animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-64 animate-pulse rounded bg-gray-800" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-800" />
        </div>
        <div className="h-16 w-24 animate-pulse rounded bg-gray-800" />
      </div>
      <div className="mb-10 grid gap-8 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl border border-gray-800 bg-gray-900/60" />
        <div className="h-96 animate-pulse rounded-xl border border-gray-800 bg-gray-900/60" />
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-gray-800 bg-gray-900/60"
          />
        ))}
      </div>
    </main>
  );
}

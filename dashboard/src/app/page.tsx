export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Board<span className="text-indigo-400">Claude</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-lg mx-auto">
          Assemble a board of AI agents that evaluate your project from multiple expert perspectives.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/results"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors"
          >
            View Results
          </a>
          <a
            href="/build"
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors"
          >
            Build a Panel
          </a>
        </div>
      </div>
    </main>
  );
}

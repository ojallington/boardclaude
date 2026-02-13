import {
  RESEARCH_DOCS,
  RESEARCH_CATEGORIES,
  type ResearchDoc,
} from "@/lib/story-data";

const CATEGORY_COLORS: Record<string, string> = {
  judges: "border-l-violet-500",
  features: "border-l-cyan-500",
  architecture: "border-l-blue-500",
  stack: "border-l-amber-500",
  strategy: "border-l-emerald-500",
};

export function ResearchGrid() {
  const grouped = RESEARCH_CATEGORIES.map((cat) => ({
    ...cat,
    docs: RESEARCH_DOCS.filter((d: ResearchDoc) => d.category === cat.key),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {grouped.map((cat) => (
        <div
          key={cat.key}
          className={`rounded-xl border border-gray-800 bg-gray-900/50 p-6 border-l-4 ${CATEGORY_COLORS[cat.key] ?? ""}`}
        >
          <h3 className="text-lg font-semibold text-gray-100 mb-1">
            {cat.label}
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            {cat.docs.length} documents
          </p>
          <ul className="space-y-2.5">
            {cat.docs.map((doc: ResearchDoc) => (
              <li key={doc.title}>
                <p className="text-sm font-medium text-gray-200">{doc.title}</p>
                <p className="text-xs text-gray-400">{doc.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

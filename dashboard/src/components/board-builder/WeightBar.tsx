"use client";

interface WeightBarProps {
  items: Array<{ name: string; weight: number; color: string }>;
}

export function WeightBar({ items }: WeightBarProps) {
  const total = items.reduce((sum, i) => sum + i.weight, 0);

  return (
    <div className="space-y-2">
      {/* Bar */}
      <div className="flex h-6 overflow-hidden rounded-lg bg-gray-800">
        {items.map((item) => {
          const pct = total > 0 ? (item.weight / total) * 100 : 0;
          if (pct < 1) return null;
          return (
            <div
              key={item.name}
              className="flex items-center justify-center text-[10px] font-medium text-white transition-all duration-300"
              style={{
                width: `${pct}%`,
                backgroundColor: item.color,
                minWidth: pct > 5 ? undefined : "2px",
              }}
              title={`${item.name}: ${pct.toFixed(0)}%`}
            >
              {pct > 12 ? `${pct.toFixed(0)}%` : ""}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-gray-300">{item.name}</span>
            <span className="text-gray-500">
              {((item.weight / (total || 1)) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

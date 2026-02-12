import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BoardClaude - Multi-Perspective Project Evaluation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AGENT_COLORS = [
  "#3b82f6", // Boris - blue
  "#8b5cf6", // Cat - violet
  "#06b6d4", // Thariq - cyan
  "#f59e0b", // Lydia - amber
  "#10b981", // Ado - emerald
  "#ef4444", // Jason - red
];

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#030712",
        padding: "60px",
      }}
    >
      {/* Title */}
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        <span style={{ color: "#ffffff" }}>Board</span>
        <span style={{ color: "#818cf8" }}>Claude</span>
      </div>

      {/* Tagline */}
      <div
        style={{
          display: "flex",
          fontSize: 28,
          color: "#9ca3af",
          marginTop: 20,
          fontWeight: 400,
          letterSpacing: "-0.01em",
        }}
      >
        We Didn&apos;t Get a Spot. So We Built the Judges.
      </div>

      {/* Agent dots */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
          marginTop: 60,
        }}
      >
        {AGENT_COLORS.map((color) => (
          <div
            key={color}
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: color,
            }}
          />
        ))}
      </div>

      {/* Panel label */}
      <div
        style={{
          display: "flex",
          fontSize: 20,
          color: "#6b7280",
          marginTop: 20,
          fontWeight: 500,
          letterSpacing: "0.05em",
          textTransform: "uppercase" as const,
        }}
      >
        6-Agent Code Evaluation Panel
      </div>
    </div>,
    {
      ...size,
    },
  );
}

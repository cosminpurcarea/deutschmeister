"use client";

export interface ChartPoint {
  label: string;        // x-axis label (e.g. "Mon")
  value: number | null; // null = no data that day
}

interface Props {
  data: ChartPoint[];
  type: "bar" | "line";
  color: string;   // hex
  yMax?: number;   // defaults to 100 for percentages, or max-of-data for counts
}

const W = 300;
const H = 90;        // total SVG height
const LABEL_H = 14;  // space reserved at bottom for x-axis labels
const CHART_H = H - LABEL_H;
const PAD_X = 4;

export default function MiniChart({ data, type, color, yMax }: Props) {
  const n = data.length;
  if (n === 0) return null;

  const max = yMax ?? Math.max(...data.map((d) => d.value ?? 0), 1);
  const stepW = (W - PAD_X * 2) / n;

  // y position inside the chart area (0 = top, CHART_H = bottom)
  const yOf = (v: number) => CHART_H - Math.max(0, Math.min(1, v / max)) * CHART_H;

  if (type === "bar") {
    const barW = stepW * 0.55;
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        aria-hidden="true"
      >
        {/* baseline */}
        <line x1={0} y1={CHART_H} x2={W} y2={CHART_H} stroke="#e5e5e5" strokeWidth={1} />

        {data.map((d, i) => {
          const cx = PAD_X + i * stepW + stepW / 2;
          const val = d.value ?? 0;
          const bh = (val / max) * CHART_H;
          return (
            <g key={i}>
              <rect
                x={cx - barW / 2}
                y={CHART_H - bh}
                width={barW}
                height={bh || 1}
                fill={color}
                rx={2}
                opacity={val === 0 ? 0.15 : 0.85}
              />
              <text
                x={cx}
                y={H - 2}
                textAnchor="middle"
                fontSize={8}
                fill="#6a6d70"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ── line chart ──────────────────────────────────────────────────────────────
  // Collect (x, y) for non-null points
  const pts = data.map((d, i) => ({
    x: PAD_X + i * stepW + stepW / 2,
    y: d.value !== null ? yOf(d.value) : null,
  }));

  // Build line path segments between consecutive non-null points
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    if (pts[i].y !== null && pts[i + 1].y !== null) {
      segments.push({
        x1: pts[i].x, y1: pts[i].y!,
        x2: pts[i + 1].x, y2: pts[i + 1].y!,
      });
    }
  }

  // Shaded area under the line (only between non-null points)
  // Build a polygon path: left edge → line → right edge → back
  let areaPath = "";
  const nonNull = pts.filter((p) => p.y !== null);
  if (nonNull.length >= 2) {
    areaPath = `M ${nonNull[0].x} ${CHART_H}`;
    for (const p of nonNull) areaPath += ` L ${p.x} ${p.y}`;
    areaPath += ` L ${nonNull[nonNull.length - 1].x} ${CHART_H} Z`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
      {/* 50% guide */}
      <line
        x1={0} y1={yOf(50)} x2={W} y2={yOf(50)}
        stroke="#e5e5e5" strokeWidth={1} strokeDasharray="3 3"
      />
      <text x={2} y={yOf(50) - 3} fontSize={7} fill="#c0c0c0">50%</text>

      {/* baseline */}
      <line x1={0} y1={CHART_H} x2={W} y2={CHART_H} stroke="#e5e5e5" strokeWidth={1} />

      {/* shaded area */}
      {areaPath && (
        <path d={areaPath} fill={color} fillOpacity={0.08} />
      )}

      {/* line segments */}
      {segments.map((s, i) => (
        <line
          key={i}
          x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
          stroke={color} strokeWidth={2} strokeLinecap="round"
        />
      ))}

      {/* dots + value labels */}
      {pts.map((p, i) =>
        p.y !== null ? (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill={color} />
            <text
              x={p.x}
              y={p.y - 6}
              textAnchor="middle"
              fontSize={8}
              fill={color}
              fontWeight="600"
            >
              {data[i].value}%
            </text>
          </g>
        ) : null,
      )}

      {/* x-axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={PAD_X + i * stepW + stepW / 2}
          y={H - 2}
          textAnchor="middle"
          fontSize={8}
          fill="#6a6d70"
        >
          {d.label}
        </text>
      ))}
    </svg>
  );
}

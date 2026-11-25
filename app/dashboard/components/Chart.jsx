"use client";

// Gráfica de línea sencilla (sin librerías). points = [{ x: "2026-11-01", y: 70.5 }]
export default function LineChart({ points, unit = "", height = 180 }) {
  const data = (points || []).filter((p) => p.y !== null && p.y !== undefined && !isNaN(Number(p.y)));
  if (data.length < 2) {
    return (
      <p style={{ fontSize: 13, color: "var(--dark-60)" }}>
        Hacen falta al menos 2 registros para ver la gráfica.
      </p>
    );
  }

  const sorted = [...data].sort((a, b) => new Date(a.x) - new Date(b.x));
  const W = 600;
  const H = height;
  const padL = 44;
  const padR = 14;
  const padT = 14;
  const padB = 26;
  const ys = sorted.map((p) => Number(p.y));
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  min -= range * 0.1;
  max += range * 0.1;

  const t0 = new Date(sorted[0].x).getTime();
  const t1 = new Date(sorted[sorted.length - 1].x).getTime();
  const tx = (x) => {
    const t = new Date(x).getTime();
    return padL + (t1 === t0 ? 0.5 : (t - t0) / (t1 - t0)) * (W - padL - padR);
  };
  const ty = (y) => padT + (1 - (Number(y) - min) / (max - min)) * (H - padT - padB);
  const fmt = (n) => Number(n).toLocaleString("es-ES", { maximumFractionDigits: 1 });
  const fmtDate = (d) => new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  const path = sorted.map((p, i) => `${i ? "L" : "M"}${tx(p.x).toFixed(1)},${ty(p.y).toFixed(1)}`).join(" ");
  const first = ys[0];
  const last = ys[ys.length - 1];
  const diff = last - first;

  return (
    <div className="line-chart">
      <div className="line-chart-summary">
        <strong>
          {fmt(last)} {unit}
        </strong>
        <span className={diff > 0 ? "up" : diff < 0 ? "down" : ""}>
          {diff > 0 ? "▲ +" : diff < 0 ? "▼ " : ""}
          {fmt(diff)} {unit} desde el {fmtDate(sorted[0].x)}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Gráfica de evolución">
        {[0, 0.5, 1].map((f) => {
          const y = padT + f * (H - padT - padB);
          const val = max - f * (max - min);
          return (
            <g key={f}>
              <line x1={padL} x2={W - padR} y1={y} y2={y} className="chart-grid" />
              <text x={padL - 6} y={y + 4} textAnchor="end" className="chart-label">
                {fmt(val)}
              </text>
            </g>
          );
        })}
        <path d={path} className="chart-line" />
        {sorted.map((p, i) => (
          <circle key={i} cx={tx(p.x)} cy={ty(p.y)} r="4" className="chart-dot">
            <title>
              {fmtDate(p.x)}: {fmt(p.y)} {unit}
            </title>
          </circle>
        ))}
        <text x={padL} y={H - 6} className="chart-label">
          {fmtDate(sorted[0].x)}
        </text>
        <text x={W - padR} y={H - 6} textAnchor="end" className="chart-label">
          {fmtDate(sorted[sorted.length - 1].x)}
        </text>
      </svg>
    </div>
  );
}

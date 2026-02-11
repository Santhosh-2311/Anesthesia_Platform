import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from "recharts"

// Window settings
const WINDOW_SECONDS = 60
const POINTS = 60

function formatTime(ts) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

// Tooltip: show value + real clock time
function MonitorTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.8)",
        color: "#fff",
        padding: "8px 10px",
        borderRadius: 8,
        fontSize: 12
      }}
    >
      <div style={{ opacity: 0.85 }}>{formatTime(p.client_ts)}</div>
      <div style={{ fontSize: 14, marginTop: 2 }}>
        <b>{typeof p.value === "number" ? p.value.toFixed(1) : "--"}</b>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const bg = status === "LIVE" ? "#16a34a" : status === "STALE" ? "#f59e0b" : "#dc2626"
  const label = status || "OFFLINE"

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 700,
        color: "#fff",
        backgroundColor: bg,
        letterSpacing: 0.3
      }}
      title={
        label === "LIVE"
          ? "New samples arriving"
          : label === "STALE"
          ? "No new samples recently"
          : "No samples for a while"
      }
    >
      {label}
    </span>
  )
}

function MetricRow({ title, value, unit, dataKey, yDomain, data, status }) {
  const warningText =
    status === "STALE" ? "No new data" : status === "OFFLINE" ? "Device offline" : null

  return (
    <div className="lm-row">
      <div className="lm-chartCard">
        <div className="lm-title">{title} Trend</div>

        <ResponsiveContainer width="100%" height={170}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            <XAxis
              dataKey="x"
              type="number"
              domain={[0, POINTS - 1]}
              tick={false}
              axisLine={false}
              tickLine={false}
            />

            <YAxis domain={yDomain} width={32} tick={{ fontSize: 12 }} tickLine={false} />

            {/* “NOW” marker */}
            <ReferenceLine x={POINTS - 1} stroke="rgba(0,0,0,0.25)" />

            <Tooltip content={<MonitorTooltip />} />

            <Line
              type="monotone"
              dataKey={dataKey}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.6 }}>
          <span>-{WINDOW_SECONDS}s</span>
          <span>NOW</span>
        </div>
      </div>

      <div className="lm-valueCard">
        <div className="lm-valueLabel">Current</div>

        <div className="lm-valueBig">{typeof value === "number" ? value.toFixed(1) : "--"}</div>

        <div className="lm-valueUnit">{unit}</div>

        {warningText && (
          <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: "#dc2626" }}>
            {warningText}
          </div>
        )}
      </div>
    </div>
  )
}

// ✅ UPDATED: now also accepts deviceId (optional)
export default function LiveMonitoring({
  telemetry = [],
  latest = null,
  status = "OFFLINE",
  lastDataArrivedAt = null,
  deviceId = null
}) {
  // Prefer latest prop (from polling); fallback to last telemetry item
  const derivedLatest = latest ?? (telemetry.length ? telemetry[telemetry.length - 1] : null)

  // Use telemetry array to plot last POINTS points
  const slice = telemetry.slice(-POINTS)

  const liveData = slice.map((d, i) => ({
    ...d,
    x: i
  }))

  // Tooltip uses "value" so create per-metric datasets
  const o2Data = liveData.map((d) => ({ ...d, value: d.o2 }))
  const n2oData = liveData.map((d) => ({ ...d, value: d.n2o }))
  const airData = liveData.map((d) => ({ ...d, value: d.air }))

  const ageMs = typeof lastDataArrivedAt === "number" ? Date.now() - lastDataArrivedAt : null

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>Live Monitoring</h2>

        {deviceId && (
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Device: <b>{deviceId}</b>
          </span>
        )}

        <StatusBadge status={status} />

        {typeof ageMs === "number" && (
          <span style={{ fontSize: 12, opacity: 0.65 }}>
            Last update: {Math.max(0, Math.round(ageMs / 1000))}s ago
          </span>
        )}
      </div>

      <MetricRow
        title="O₂"
        value={derivedLatest?.o2}
        unit="%"
        data={o2Data}
        dataKey="o2"
        yDomain={[21, 100]}
        status={status}
      />

      <MetricRow
        title="N₂O"
        value={derivedLatest?.n2o}
        unit="%"
        data={n2oData}
        dataKey="n2o"
        yDomain={[0, 70]}
        status={status}
      />

      <MetricRow
        title="Air"
        value={derivedLatest?.air}
        unit="%"
        data={airData}
        dataKey="air"
        yDomain={[0, 79]}
        status={status}
      />

      {!derivedLatest && <p style={{ marginTop: 10, color: "#666" }}>Waiting for telemetry...</p>}
    </div>
  )
}

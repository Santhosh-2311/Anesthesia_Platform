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

const WINDOW_SECONDS = 60
const POINTS = 60

function formatTime(ts) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

function MonitorTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div
      style={{
        background: "rgba(0,0,0,0.85)",
        color: "#fff",
        padding: "8px 10px",
        borderRadius: 10,
        fontSize: 12,
        minWidth: 140
      }}
    >
      <div style={{ opacity: 0.85 }}>{formatTime(p.client_ts || p.timestamp)}</div>
      <div style={{ fontSize: 14, marginTop: 2 }}>
        <b>{typeof p.value === "number" ? p.value.toFixed(2) : "--"}</b>
      </div>
    </div>
  )
}

function StatusBadge({ status = "OFFLINE" }) {
  const bg = status === "LIVE" ? "#16a34a" : status === "STALE" ? "#f59e0b" : "#dc2626"
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color: "#fff",
        backgroundColor: bg,
        letterSpacing: 0.3
      }}
    >
      {status}
    </span>
  )
}

function Card({ title, right, children }) {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 14,
        padding: 14,
        background: "#fff",
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)"
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800, fontSize: 13, opacity: 0.75 }}>{title}</div>
        {right}
      </div>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  )
}

function BigValue({ value, unit, suffix }) {
  const v = typeof value === "number" ? value : null
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1 }}>
        {v != null ? v.toFixed(1) : "--"}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, opacity: 0.6 }}>
        {unit || ""}
        {suffix ? ` ${suffix}` : ""}
      </div>
    </div>
  )
}

function SmallKV({ k, v, unit }) {
  const show =
    typeof v === "number"
      ? v.toFixed(2).replace(/\.00$/, "")
      : v != null && v !== ""
      ? String(v)
      : "--"
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
      <div style={{ opacity: 0.7, fontWeight: 700 }}>{k}</div>
      <div style={{ fontWeight: 900 }}>
        {show}
        {unit ? <span style={{ opacity: 0.6, fontWeight: 800 }}> {unit}</span> : null}
      </div>
    </div>
  )
}

function Trend({ data, dataKey, yDomain }) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="x"
          type="number"
          domain={[0, POINTS - 1]}
          tick={false}
          axisLine={false}
          tickLine={false}
        />
        <YAxis domain={yDomain} width={34} tick={{ fontSize: 12 }} tickLine={false} />
        <ReferenceLine x={POINTS - 1} stroke="rgba(0,0,0,0.25)" />
        <Tooltip content={<MonitorTooltip />} />
        <Line type="monotone" dataKey={dataKey} dot={false} strokeWidth={2} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

/**
 * Full monitor layout for schema_version=2 / latest_point.metrics
 * Expects telemetry points already adapted by telemetryAdapter.js to include:
 * fio2, n2o_conc, air_conc,
 * o2_lpm, air_lpm, n2o_lpm, total_lpm,
 * vent_mode, rr_set,
 * peep, pip,
 * vt_set_ml, vt_measured_ml, ie_set, ti_set_s, te_set_s,
 * line_o2_kpa, line_n2_kpa, line_air_kpa,
 * timestamp/client_ts/received_at_ms/deviceId
 */
export default function LiveMonitoring({
  telemetry = [],
  latest = null,
  status = "LIVE",
  lastDataArrivedAt = null,
  selectedDeviceId = null
}) {
  const derivedLatest = latest ?? (telemetry.length ? telemetry[telemetry.length - 1] : null)

  const slice = telemetry.slice(-POINTS)
  const liveData = slice.map((d, i) => ({ ...d, x: i }))

  const makeSeries = (key) => liveData.map((d) => ({ ...d, value: d[key] }))

  const ageMs = typeof lastDataArrivedAt === "number" ? Date.now() - lastDataArrivedAt : null
  const ageText = typeof ageMs === "number" ? `${Math.max(0, Math.round(ageMs / 1000))}s ago` : null

  return (
    <div className="container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>Live Monitoring</h2>
        <StatusBadge status={status} />
        {selectedDeviceId && (
          <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.65 }}>
            Device: {selectedDeviceId}
          </span>
        )}
        {ageText && (
          <span style={{ fontSize: 12, fontWeight: 800, opacity: 0.65 }}>Last update: {ageText}</span>
        )}
      </div>

      {!derivedLatest ? (
        <p style={{ marginTop: 10, color: "#666" }}>Waiting for telemetry...</p>
      ) : (
        <>
          {/* Top row: Gas concentrations */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 12
            }}
          >
            <Card title="FiO₂">
              <BigValue value={derivedLatest.fio2} unit="%" />
              <div style={{ marginTop: 8 }}>
                <Trend data={makeSeries("fio2")} dataKey="fio2" yDomain={[21, 100]} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.6 }}>
                  <span>-{WINDOW_SECONDS}s</span>
                  <span>NOW</span>
                </div>
              </div>
            </Card>

            <Card title="N₂O Concentration">
              <BigValue value={derivedLatest.n2o_conc} unit="%" />
              <div style={{ marginTop: 8 }}>
                <Trend data={makeSeries("n2o_conc")} dataKey="n2o_conc" yDomain={[0, 100]} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.6 }}>
                  <span>-{WINDOW_SECONDS}s</span>
                  <span>NOW</span>
                </div>
              </div>
            </Card>

            <Card title="Air Concentration">
              <BigValue value={derivedLatest.air_conc} unit="%" />
              <div style={{ marginTop: 8 }}>
                <Trend data={makeSeries("air_conc")} dataKey="air_conc" yDomain={[0, 100]} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: 0.6 }}>
                  <span>-{WINDOW_SECONDS}s</span>
                  <span>NOW</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Middle row: Flow + Ventilator + Pressures/Volumes */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 12
            }}
          >
            <Card title="Flow">
              <BigValue value={derivedLatest.total_lpm} unit="L/min" />
              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <SmallKV k="O₂" v={derivedLatest.o2_lpm} unit="L/min" />
                <SmallKV k="Air" v={derivedLatest.air_lpm} unit="L/min" />
                <SmallKV k="N₂O" v={derivedLatest.n2o_lpm} unit="L/min" />
              </div>
              <div style={{ marginTop: 10 }}>
                <Trend data={makeSeries("total_lpm")} dataKey="total_lpm" yDomain={[0, 20]} />
              </div>
            </Card>

            <Card title="Ventilator">
              <div style={{ display: "grid", gap: 10 }}>
                <SmallKV k="Mode" v={derivedLatest.vent_mode} />
                <SmallKV k="RR set" v={derivedLatest.rr_set} unit="/min" />
                <SmallKV k="I:E set" v={derivedLatest.ie_set} />
                <SmallKV k="Ti set" v={derivedLatest.ti_set_s} unit="s" />
                <SmallKV k="Te set" v={derivedLatest.te_set_s} unit="s" />
              </div>
            </Card>

            <Card title="Pressures & Volumes">
              <div style={{ display: "grid", gap: 10 }}>
                <SmallKV k="PEEP" v={derivedLatest.peep} unit="cmH₂O" />
                <SmallKV k="PIP" v={derivedLatest.pip} unit="cmH₂O" />
                <SmallKV k="VT set" v={derivedLatest.vt_set_ml} unit="mL" />
                <SmallKV k="VT measured" v={derivedLatest.vt_measured_ml} unit="mL" />
              </div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.65, marginBottom: 6 }}>PIP trend</div>
                  <Trend data={makeSeries("pip")} dataKey="pip" yDomain={[0, 40]} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.65, marginBottom: 6 }}>VT trend</div>
                  <Trend data={makeSeries("vt_measured_ml")} dataKey="vt_measured_ml" yDomain={[0, 800]} />
                </div>
              </div>
            </Card>
          </div>

          {/* Bottom row: Line pressures */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
            <Card title="Main High Pressure — O₂">
              <BigValue value={derivedLatest.line_o2_kpa} unit="kPa" />
              <div style={{ marginTop: 8 }}>
                <Trend data={makeSeries("line_o2_kpa")} dataKey="line_o2_kpa" yDomain={[0, 600]} />
              </div>
            </Card>

            <Card title="Main High Pressure — N₂">
              <BigValue value={derivedLatest.line_n2_kpa} unit="kPa" />
              <div style={{ marginTop: 8 }}>
                <Trend data={makeSeries("line_n2_kpa")} dataKey="line_n2_kpa" yDomain={[0, 600]} />
              </div>
            </Card>

            <Card title="Main High Pressure — Air">
              <BigValue value={derivedLatest.line_air_kpa} unit="kPa" />
              <div style={{ marginTop: 8 }}>
                <Trend data={makeSeries("line_air_kpa")} dataKey="line_air_kpa" yDomain={[0, 600]} />
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

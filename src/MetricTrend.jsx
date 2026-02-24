import { useMemo, useRef, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

import { useLiveTelemetry } from "./hooks/useLiveTelemetry"

function formatClockTime(ms) {
  if (!ms) return ""
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

const METRICS = {
  fio2: { label: "FiO₂", unit: "%", yDomain: [0, 100] },
  n2o: { label: "N₂O", unit: "%", yDomain: [0, 100] },
  air: { label: "Air", unit: "%", yDomain: [0, 100] },

  totalFlow: { label: "Total Flow", unit: "L/min" },
  o2Flow: { label: "O₂ Flow", unit: "L/min" },
  airFlow: { label: "Air Flow", unit: "L/min" },
  n2oFlow: { label: "N₂O Flow", unit: "L/min" },

  pip: { label: "PIP", unit: "cmH₂O" },
  peep: { label: "PEEP", unit: "cmH₂O" },

  vtMeasured: { label: "VT Measured", unit: "mL" },
}

// ✅ Same mapping used in LiveTelemetry.jsx
const DEVICE_ID_MAP = {
  "AW-001": "anesthesia_001",
  // add more if needed:
  // "AW-002": "anesthesia_002",
}

function resolveBackendDeviceId(routeDeviceId) {
  // keep your existing progress: explicit override wins
  const saved = localStorage.getItem("selectedBackendDeviceId")
  if (saved) return saved

  // fallback mapping for AW-xxx routes
  return DEVICE_ID_MAP[routeDeviceId] || routeDeviceId
}

function useMeasure() {
  const ref = useRef(null)
  const [rect, setRect] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current

    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (!r) return
      const w = Math.max(0, Math.floor(r.width))
      const h = Math.max(0, Math.floor(r.height))
      setRect((prev) =>
        prev.width === w && prev.height === h ? prev : { width: w, height: h }
      )
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, rect]
}

export default function MetricTrend() {
  const navigate = useNavigate()
  const { groupId, deviceId, metricKey } = useParams()

  const meta = METRICS[metricKey]
  const backendId = useMemo(() => resolveBackendDeviceId(deviceId), [deviceId])

  const { data: telemetry = [], latest = null, status } = useLiveTelemetry(backendId, {
    pollMs: 1000,
    bufferSize: 120,
  })

  const chartData = useMemo(() => {
    return telemetry
      .map((p) => ({ tsMs: p.tsMs, value: p?.[metricKey] }))
      .filter((d) => d.tsMs && d.value !== undefined && d.value !== null)
  }, [telemetry, metricKey])

  const [wrapRef, rect] = useMeasure()
  const ready = rect.width > 50 && rect.height > 50

  if (!meta) {
    return (
      <div className="card">
        <div className="cardTitle">Unknown metric</div>
        <div className="muted">Metric key: {metricKey}</div>
        <button className="btnLink" onClick={() => navigate(-1)} style={{ marginTop: 12 }}>
          ← Back
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="pageHeaderRow">
        <h1 className="titleBig">
          {meta.label} Trend — <span className="mono">{deviceId}</span>
        </h1>

        <button
          className="btnLink"
          onClick={() => navigate(`/groups/${groupId}/devices/${deviceId}/live`)}
        >
          ← Back
        </button>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="muted">
          Current {status?.tag ? `(${status.tag})` : ""}
        </div>
        <div style={{ fontSize: 34, fontWeight: 900 }}>
          {latest?.[metricKey] ?? "--"}{" "}
          <span style={{ fontSize: 16, fontWeight: 700 }}>{meta.unit}</span>
        </div>
      </div>

      <div className="card">
        <div className="cardTitle">{meta.label}</div>

        <div ref={wrapRef} className="chartWrap" style={{ height: 360 }}>
          {ready ? (
            <LineChart width={rect.width} height={rect.height} data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="tsMs"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatClockTime}
                minTickGap={28}
              />
              <YAxis domain={meta.yDomain || ["auto", "auto"]} />
              <Tooltip
                labelFormatter={(v) => formatClockTime(v)}
                formatter={(v) => [`${v ?? "--"} ${meta.unit}`, meta.label]}
              />
              {/* keep your style; optionally set dot={true} if you want single-point visibility */}
              <Line
                type="monotone"
                dataKey="value"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <div className="muted" style={{ padding: 12 }}>
              Preparing chart…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
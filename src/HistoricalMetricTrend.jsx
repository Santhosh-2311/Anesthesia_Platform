import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { fetchTelemetryRange } from "./api/telemetry"

// Maps frontend device IDs to backend database/device identifiers
const DEVICE_ID_MAP = { "AW-001": "anesthesia_001" }

function resolveBackendDeviceId(routeDeviceId) {

  // Uses locally saved device selection if available
  // otherwise falls back to predefined mapping
  const saved = localStorage.getItem("selectedBackendDeviceId")
  if (saved) return saved

  return DEVICE_ID_MAP[routeDeviceId] || routeDeviceId
}

// Safely converts telemetry values into valid numbers
// Prevents chart rendering errors from invalid/null values
function toFiniteNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Metadata configuration for each telemetry metric
// Defines chart labels, units, and axis ranges
const METRICS = {
  fio2: { label: "FiO₂", unit: "%", yDomain: [0, 100] },
  n2o: { label: "N₂O", unit: "%", yDomain: [0, 100] },
  air: { label: "Air", unit: "%", yDomain: [0, 100] },
  pip: { label: "PIP", unit: "cmH₂O" },
  peep: { label: "PEEP", unit: "cmH₂O" },
  vt_measured_ml: { label: "VT Measured", unit: "mL" },
}

// Converts JavaScript Date into datetime-local input format
function toInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0")

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Converts browser local datetime input into ISO timestamp
// Used for backend API requests
function toIsoFromLocalInput(v) {
  return new Date(v).toISOString()
}

// Formats chart timestamps into readable HH:MM:SS labels
function fmtTick(ms) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export default function HistoricalMetricTrend() {
  const nav = useNavigate()

  // Extract route parameters from URL
  const { groupId, deviceId, metricKey } = useParams()

  // Get metric configuration
  const meta = METRICS[metricKey]

  // Resolve backend device identifier
  const backendId = resolveBackendDeviceId(deviceId)

  // Default historical range set to last 5 minutes
  const now = new Date()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)

  // React state for selected date range
  const [startLocal, setStartLocal] = useState(toInputValue(fiveMinAgo))
  const [endLocal, setEndLocal] = useState(toInputValue(now))

  // Stores fetched telemetry rows
  const [rows, setRows] = useState([])

  // Loading state for API requests
  const [loading, setLoading] = useState(false)

  // Fetch historical telemetry data from backend
  async function load() {
    setLoading(true)

    try {

      // Request telemetry range from backend API
      const json = await fetchTelemetryRange({
        deviceId: backendId,
        startIso: toIsoFromLocalInput(startLocal),
        endIso: toIsoFromLocalInput(endLocal),
      })

      let normalized = []

      // Supports multiple backend response formats
      if (Array.isArray(json)) normalized = json
      else if (Array.isArray(json?.data)) normalized = json.data

      // Sort telemetry chronologically
      normalized.sort((a, b) => (a?.ts || 0) - (b?.ts || 0))

      console.log("Historical metric raw rows:", normalized)

      // Save telemetry rows into component state
      setRows(normalized)

    } catch (e) {

      console.error(e)

      // Clear data if request fails
      setRows([])

    } finally {

      // Stop loading indicator
      setLoading(false)
    }
  }

  // Converts raw telemetry rows into chart-compatible structure
  const chartData = useMemo(() => {

    const parsed = rows
      .map((r) => {

        // Convert UNIX timestamp into milliseconds
        const tsMs = Number(r?.ts) * 1000

        // Extract selected telemetry metric value
        const v = toFiniteNumber(r?.[metricKey])

        // Skip invalid telemetry samples
        if (!Number.isFinite(tsMs) || v === null) return null

        return {
          t: tsMs,
          v,
        }
      })

      // Remove invalid/null rows
      .filter(Boolean)

    console.log("Historical metric chart data:", parsed)

    return parsed

  }, [rows, metricKey])

  // Invalid metric protection
  if (!meta) return <div>Unknown metric</div>

  // Dynamically adjusts chart width based on telemetry sample count
  const chartWidth = Math.max(chartData.length * 8, 1000)

  return (
    <div>
      <h1>
        {meta.label} History — {deviceId}
      </h1>

      {/* Navigation back to history dashboard */}
      <button
        onClick={() =>
          nav(`/groups/${groupId}/devices/${deviceId}/history`)
        }
      >
        ← Back
      </button>

      {/* Date range selection controls */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="datetime-local"
          value={startLocal}
          onChange={(e) => setStartLocal(e.target.value)}
        />

        <input
          type="datetime-local"
          value={endLocal}
          onChange={(e) => setEndLocal(e.target.value)}
        />

        {/* Load historical telemetry */}
        <button onClick={load}>
          {loading ? "Loading..." : "Load"}
        </button>

        {/* Displays telemetry sample count */}
        <span style={{ marginLeft: 10 }}>
          Samples: {rows.length}
        </span>
      </div>

      {/* Horizontally scrollable chart container */}
      <div style={{ overflowX: "auto" }}>

        {/* Recharts line chart for telemetry visualization */}
        <LineChart width={chartWidth} height={360} data={chartData}>

          <CartesianGrid strokeDasharray="3 3" />

          {/* Time axis */}
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={fmtTick}
            minTickGap={40}
          />

          {/* Metric value axis */}
          <YAxis domain={meta.yDomain || ["auto", "auto"]} />

          {/* Tooltip shown on hover */}
          <Tooltip
            labelFormatter={(v) =>
              new Date(v).toLocaleString()
            }
            formatter={(v) => [`${v} ${meta.unit}`, meta.label]}
          />

          {/* Main telemetry trend line */}
          <Line
            type="monotone"
            dataKey="v"
            dot={false}
            strokeWidth={2}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    </div>
  )
}
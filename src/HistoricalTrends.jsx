import { useMemo, useState } from "react"
import { useParams } from "react-router-dom"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"
import { fetchTelemetryRange } from "./api/telemetry"

// Maps frontend device IDs to backend device identifiers
const DEVICE_ID_MAP = { "AW-001": "anesthesia_001" }

function resolveBackendDeviceId(routeDeviceId) {

  // Uses saved device selection if available
  // otherwise falls back to predefined mapping
  const saved = localStorage.getItem("selectedBackendDeviceId")
  if (saved) return saved

  return DEVICE_ID_MAP[routeDeviceId] || routeDeviceId
}

// Safely converts telemetry values into valid numeric values
// Prevents chart rendering issues from invalid/null inputs
function toFiniteNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// Groups telemetry metrics into logical monitoring categories
// Used for rendering multiple trend charts
const GROUPS = [
  {
    title: "Gas Mix",
    yDomain: [0, 100],
    metrics: ["fio2", "n2o", "air"],
  },
  {
    title: "Pressures",
    metrics: ["pip", "peep"],
  },
  {
    title: "Volumes",
    metrics: ["vt_measured_ml"],
  },
]

// Converts Date object into datetime-local input format
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

// Formats timestamps into readable chart labels
function fmtTick(ms) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

// Normalizes raw telemetry rows into chart-compatible format
function normalizeHistoricalRow(r) {

  // Convert UNIX timestamp into milliseconds
  const tsMs = Number(r?.ts) * 1000

  if (!Number.isFinite(tsMs)) return null

  return {

    // Shared timestamp for all telemetry metrics
    t: tsMs,

    // Clinical telemetry parameters
    fio2: toFiniteNumber(r?.fio2),
    n2o: toFiniteNumber(r?.n2o),
    air: toFiniteNumber(r?.air),
    pip: toFiniteNumber(r?.pip),
    peep: toFiniteNumber(r?.peep),
    vt_measured_ml: toFiniteNumber(r?.vt_measured_ml),
  }
}

export default function HistoricalTrends() {

  // Extract selected device from route parameters
  const { deviceId } = useParams()

  // Resolve backend device identifier
  const backendId = resolveBackendDeviceId(deviceId)

  // Default historical range set to last 5 minutes
  const now = new Date()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)

  // React state for date range selection
  const [startLocal, setStartLocal] = useState(toInputValue(fiveMinAgo))
  const [endLocal, setEndLocal] = useState(toInputValue(now))

  // Stores fetched telemetry rows
  const [rows, setRows] = useState([])

  // Loading indicator state
  const [loading, setLoading] = useState(false)

  // Fetch historical telemetry from backend API
  async function load() {
    setLoading(true)

    try {

      // Request telemetry range from backend
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

      console.log("Historical raw rows:", normalized)

      // Save telemetry rows into component state
      setRows(normalized)

    } catch (e) {

      console.error(e)

      // Clear data on API failure
      setRows([])

    } finally {

      // Stop loading indicator
      setLoading(false)
    }
  }

  // Memoized transformation of telemetry rows into chart-ready structure
  const chartRows = useMemo(() => {

    const parsed = rows
      .map(normalizeHistoricalRow)
      .filter(Boolean)

    console.log("Historical chart rows:", parsed)

    return parsed

  }, [rows])

  // Dynamically scales chart width based on telemetry sample count
  const chartWidth = Math.max(chartRows.length * 8, 1200)

  return (
    <div>
      <h1>Historical Trends — {deviceId}</h1>

      {/* Date range controls */}
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

        {/* Trigger historical telemetry loading */}
        <button onClick={load}>
          {loading ? "Loading..." : "Load"}
        </button>

        {/* Display total telemetry samples */}
        <span style={{ marginLeft: 10 }}>
          Samples: {rows.length}
        </span>
      </div>

      {/* Render grouped telemetry charts */}
      {GROUPS.map((g) => (
        <div key={g.title} style={{ marginBottom: 40 }}>

          <h3>{g.title}</h3>

          {/* Horizontally scrollable chart container */}
          <div style={{ overflowX: "auto" }}>

            {/* Recharts line chart */}
            <LineChart width={chartWidth} height={330} data={chartRows}>

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

              {/* Value axis */}
              <YAxis domain={g.yDomain || ["auto", "auto"]} />

              {/* Hover tooltip */}
              <Tooltip
                labelFormatter={(v) =>
                  new Date(v).toLocaleString()
                }
              />

              {/* Render telemetry trend lines dynamically */}
              {g.metrics.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </div>
        </div>
      ))}
    </div>
  )
}

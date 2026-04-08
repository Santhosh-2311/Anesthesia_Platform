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

const DEVICE_ID_MAP = { "AW-001": "anesthesia_001" }

function resolveBackendDeviceId(routeDeviceId) {
  const saved = localStorage.getItem("selectedBackendDeviceId")
  if (saved) return saved
  return DEVICE_ID_MAP[routeDeviceId] || routeDeviceId
}

// ✅ Treat backend historical time as UTC
function parseBackendTimeUtc(str) {
  if (!str) return null

  // format: "2026-02-26 07:00:00.000"
  const [datePart, timePart] = str.split(" ")
  if (!datePart || !timePart) return null

  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute, secondMs] = timePart.split(":")
  const [second] = secondMs.split(".")

  return Date.UTC(
    year,
    month - 1,
    day,
    Number(hour),
    Number(minute),
    Number(second)
  )
}

function toFiniteNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

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

function toInputValue(d) {
  const pad = (n) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toIsoFromLocalInput(v) {
  return new Date(v).toISOString()
}

function fmtTick(ms) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

function normalizeHistoricalRow(r) {
  const tsMs = parseBackendTimeUtc(r?.time)
  if (!tsMs) return null

  return {
    t: tsMs,
    fio2: toFiniteNumber(r?.fio2),
    n2o: toFiniteNumber(r?.n2o),
    air: toFiniteNumber(r?.air),
    pip: toFiniteNumber(r?.pip),
    peep: toFiniteNumber(r?.peep),
    vt_measured_ml: toFiniteNumber(r?.vt_measured_ml),
  }
}

export default function HistoricalTrends() {
  const { deviceId } = useParams()
  const backendId = resolveBackendDeviceId(deviceId)

  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const [startLocal, setStartLocal] = useState(toInputValue(oneHourAgo))
  const [endLocal, setEndLocal] = useState(toInputValue(now))
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)

    try {
      const json = await fetchTelemetryRange({
        deviceId: backendId,
        startIso: toIsoFromLocalInput(startLocal),
        endIso: toIsoFromLocalInput(endLocal),
      })

      let normalized = []

      if (Array.isArray(json)) normalized = json
      else if (Array.isArray(json?.data)) normalized = json.data

      normalized.sort(
        (a, b) =>
          (parseBackendTimeUtc(a?.time) || 0) -
          (parseBackendTimeUtc(b?.time) || 0)
      )

      setRows(normalized)
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const chartRows = useMemo(() => {
    return rows.map(normalizeHistoricalRow).filter(Boolean)
  }, [rows])

  const chartWidth = Math.max(chartRows.length * 8, 1200)

  return (
    <div>
      <h1>Historical Trends — {deviceId}</h1>

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
        <button onClick={load}>
          {loading ? "Loading..." : "Load"}
        </button>
        <span style={{ marginLeft: 10 }}>
          Samples: {rows.length}
        </span>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title} style={{ marginBottom: 40 }}>
          <h3>{g.title}</h3>

          <div style={{ overflowX: "auto" }}>
            <LineChart width={chartWidth} height={330} data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={fmtTick}
                minTickGap={40}
              />
              <YAxis domain={g.yDomain || ["auto", "auto"]} />
              <Tooltip
                labelFormatter={(v) =>
                  new Date(v).toLocaleString()
                }
              />
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
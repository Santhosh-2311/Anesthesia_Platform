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

const DEVICE_ID_MAP = { "AW-001": "anesthesia_001" }

function resolveBackendDeviceId(routeDeviceId) {
  const saved = localStorage.getItem("selectedBackendDeviceId")
  if (saved) return saved
  return DEVICE_ID_MAP[routeDeviceId] || routeDeviceId
}

function parseLocalTime(str) {
  if (!str) return null

  const [datePart, timePart] = str.split(" ")
  if (!datePart || !timePart) return null

  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute, secondMs] = timePart.split(":")
  const [second] = secondMs.split(".")

  return new Date(
    year,
    month - 1,
    day,
    Number(hour),
    Number(minute),
    Number(second)
  ).getTime()
}

const METRICS = {
  fio2: { label: "FiO₂", unit: "%", yDomain: [0, 100] },
  n2o: { label: "N₂O", unit: "%", yDomain: [0, 100] },
  air: { label: "Air", unit: "%", yDomain: [0, 100] },
  pip: { label: "PIP", unit: "cmH₂O" },
  peep: { label: "PEEP", unit: "cmH₂O" },
  vt_measured_ml: { label: "VT Measured", unit: "mL" },
}

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
    hour12: false,
  })
}

export default function HistoricalMetricTrend() {
  const nav = useNavigate()
  const { groupId, deviceId, metricKey } = useParams()
  const meta = METRICS[metricKey]
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

      setRows(normalized)
    } catch (e) {
      console.error(e)
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => {
    return rows
      .map((r) => {
        if (!r.time) return null

        const ts = parseLocalTime(r.time)
        if (!ts) return null

        return {
          t: ts,
          v: Number(r[metricKey]),
        }
      })
      .filter((d) => d && Number.isFinite(d.v))
  }, [rows, metricKey])

  const chartWidth = Math.max(chartData.length * 6, 1000)

  if (!meta) return <div>Unknown metric</div>

  return (
    <div>
      <h1>
        {meta.label} History — {deviceId}
      </h1>

      <button
        onClick={() =>
          nav(`/groups/${groupId}/devices/${deviceId}/history`)
        }
      >
        ← Back
      </button>

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

      <div style={{ overflowX: "auto" }}>
        <LineChart width={chartWidth} height={360} data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={fmtTick}
          />
          <YAxis domain={meta.yDomain || ["auto", "auto"]} />
          <Tooltip
            labelFormatter={(v) =>
              new Date(v).toLocaleString()
            }
            formatter={(v) => [`${v} ${meta.unit}`, meta.label]}
          />
          <Line
            type="monotone"
            dataKey="v"
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </div>
    </div>
  )
}
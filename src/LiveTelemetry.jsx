import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import LiveMonitoring from "./LiveMonitoring"
import { adaptTelemetry } from "./telemetryAdapter"
import { fetchLatestTelemetry } from "./api/telemetry"

const POINTS = 60
const POLL_MS = 1000
const STALE_AFTER_MS = 5000
const OFFLINE_AFTER_MS = 15000

// ✅ TEMP mapping: UI ids -> cloud device_id
const DEVICE_ID_MAP = {
  "AW-001": "anesthesia_001",
  "AW-002": "anesthesia_001" // TEMP
}

function computeStatus(lastDataArrivedAt) {
  if (!lastDataArrivedAt) return "OFFLINE"
  const age = Date.now() - lastDataArrivedAt
  if (age > OFFLINE_AFTER_MS) return "OFFLINE"
  if (age > STALE_AFTER_MS) return "STALE"
  return "LIVE"
}

function pickLatest(raw) {
  if (Array.isArray(raw)) return raw[raw.length - 1]
  if (raw?.items && Array.isArray(raw.items)) return raw.items[raw.items.length - 1]
  if (raw?.data && Array.isArray(raw.data)) return raw.data[raw.data.length - 1]
  return raw
}

export default function LiveTelemetry() {
  const { deviceId } = useParams()

  const [telemetry, setTelemetry] = useState([])
  const [latest, setLatest] = useState(null)
  const [lastDataArrivedAt, setLastDataArrivedAt] = useState(null)
  const [status, setStatus] = useState("OFFLINE")

  const lastTsRef = useRef(null)

  useEffect(() => {
    setTelemetry([])
    setLatest(null)
    setLastDataArrivedAt(null)
    setStatus("OFFLINE")
    lastTsRef.current = null
  }, [deviceId])

  useEffect(() => {
    if (!deviceId) return

    const cloudDeviceId = DEVICE_ID_MAP[deviceId] || deviceId
    let alive = true

    async function tick() {
      try {
        const raw = await fetchLatestTelemetry({ deviceId: cloudDeviceId })
        const latestRaw = pickLatest(raw)
        if (!latestRaw) return

        const point = adaptTelemetry(latestRaw)
        if (!point) return

        // block NaN
        if (![point.o2, point.n2o, point.air].every((v) => Number.isFinite(v))) return

        if (!alive) return

        if (point.timestamp && lastTsRef.current === point.timestamp) return
        if (point.timestamp) lastTsRef.current = point.timestamp

        setLatest(point)
        setLastDataArrivedAt(Date.now())

        setTelemetry((prev) => {
          const next = [...prev, point]
          return next.length > POINTS ? next.slice(next.length - POINTS) : next
        })
      } catch {
        // ignore single errors; status aging handles it
      }
    }

    tick()
    const id = setInterval(tick, POLL_MS)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [deviceId])

  useEffect(() => {
    const id = setInterval(() => setStatus(computeStatus(lastDataArrivedAt)), 500)
    return () => clearInterval(id)
  }, [lastDataArrivedAt])

  const props = useMemo(
    () => ({ telemetry, latest, status, lastDataArrivedAt, deviceId }),
    [telemetry, latest, status, lastDataArrivedAt, deviceId]
  )

  return <LiveMonitoring {...props} />
}

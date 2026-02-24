// src/LiveTelemetry.jsx
import { useMemo } from "react"
import { useParams } from "react-router-dom"
import LiveMonitoring from "./LiveMonitoring"
import { useLiveTelemetry } from "./hooks/useLiveTelemetry"

// ✅ UI route id -> backend device_id mapping
const DEVICE_ID_MAP = {
  "AW-001": "anesthesia_001",
  // add more when needed:
  // "AW-002": "anesthesia_002",
}

function resolveBackendDeviceId(routeDeviceId) {
  // keep your current progress: if you already set selectedBackendDeviceId, it wins
  const saved = localStorage.getItem("selectedBackendDeviceId")
  if (saved) return saved

  // fallback mapping for routes like AW-001
  return DEVICE_ID_MAP[routeDeviceId] || routeDeviceId
}

export default function LiveTelemetry() {
  const { deviceId } = useParams()

  const backendId = useMemo(() => resolveBackendDeviceId(deviceId), [deviceId])

  const { data = [], latest = null, status = null, lastUpdateMs = 0 } =
    useLiveTelemetry(backendId, {
      pollMs: 1000,
      bufferSize: 120,
    })

  return (
    <LiveMonitoring
      latest={latest}
      telemetry={data}
      status={status}
      lastUpdateMs={lastUpdateMs}
    />
  )
}
// src/LiveTelemetry.jsx
import { useMemo } from "react"
import { useParams } from "react-router-dom"
import LiveMonitoring from "./LiveMonitoring"
import { useLiveTelemetry } from "./hooks/useLiveTelemetry"

// Maps frontend route device IDs
// to backend telemetry device identifiers
const DEVICE_ID_MAP = {
  "AW-1001": "anesthesia_001",
  // add more when needed:
  // "AW-002": "anesthesia_002",
}

function resolveBackendDeviceId(routeDeviceId) {

  // Uses locally selected backend device if available
  // This preserves current device selection state
  const saved = localStorage.getItem("selectedBackendDeviceId")
  if (saved) return saved

  // Fallback mapping for route-based device IDs
  return DEVICE_ID_MAP[routeDeviceId] || routeDeviceId
}

export default function LiveTelemetry() {

  // Extract device ID from URL route
  const { deviceId } = useParams()

  // Memoized backend device resolution
  // avoids unnecessary recalculations on re-render
  const backendId = useMemo(() => resolveBackendDeviceId(deviceId), [deviceId])
  console.log("ROUTE DEVICE:", deviceId)
console.log("BACKEND DEVICE:", backendId)

  // Initializes real-time telemetry polling hook
  // pollMs = fetch telemetry every 1 second
  // bufferSize = maintain last 120 telemetry samples
  const { data = [], latest = null, status = null, lastUpdateMs = 0 } =
    useLiveTelemetry(backendId, {
      pollMs: 1000,
      bufferSize: 120,
    })

    console.log("LATEST:", latest)
console.log("DATA:", data)
console.log("STATUS:", status)

  return (

    // Passes live telemetry data into dashboard UI layer
    <LiveMonitoring
      latest={latest}
      telemetry={data}
      status={status}
      lastUpdateMs={lastUpdateMs}
    />
  )
}
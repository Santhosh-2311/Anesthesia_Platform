// src/api/telemetry.js
const BASE_URL = "https://tdeoo8mxk3.execute-api.ap-south-1.amazonaws.com"

function tryParseJsonString(s) {
  if (typeof s !== "string") return null
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

/**
 * Fetches the latest telemetry payload for a device.
 *
 * Supports both:
 *   fetchLatestTelemetry({ deviceId })
 *   fetchLatestTelemetry(deviceId)
 */
export async function fetchLatestTelemetry(arg) {
  const deviceId =
    typeof arg === "string"
      ? arg
      : arg && typeof arg === "object"
        ? arg.deviceId
        : undefined

  // ✅ backend expects device_id (snake_case)
  // ❌ do NOT send ts=Date.now() (backend may treat it as a filter cursor)
  // ✅ use "_" only as cache-buster
  const params = new URLSearchParams()
  params.set("_", String(Date.now()))
  if (deviceId) params.append("device_id", deviceId)

  const res = await fetch(`${BASE_URL}/latest?${params.toString()}`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) throw new Error(`Telemetry fetch failed (${res.status})`)

  const json = await res.json()

  // Lambda proxy body support (just in case)
  if (json && typeof json === "object" && typeof json.body === "string") {
    const parsed = tryParseJsonString(json.body)
    if (parsed) return parsed
  }

  return json
}
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

export async function fetchLatestTelemetry({ deviceId } = {}) {
  const params = new URLSearchParams({ ts: String(Date.now()) })
  if (deviceId) params.append("deviceId", deviceId)

  const res = await fetch(`${BASE_URL}/latest?${params.toString()}`)
  if (!res.ok) throw new Error(`Telemetry fetch failed (${res.status})`)

  const json = await res.json()

  // Lambda proxy body support (just in case)
  if (json && typeof json === "object" && typeof json.body === "string") {
    const parsed = tryParseJsonString(json.body)
    if (parsed) return parsed
  }

  return json
}

// src/api/telemetry.js

/* =========================================================
   BASE CONFIG
========================================================= */

const LIVE_BASE =
  "https://tdeoo8mxk3.execute-api.ap-south-1.amazonaws.com"

const HIST_BASE = import.meta.env.VITE_API_BASE_URL
const API_KEY = import.meta.env.VITE_API_KEY

function tryParseJsonString(s) {
  if (typeof s !== "string") return null
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

/* =========================================================
   LIVE TELEMETRY (DynamoDB)
========================================================= */

export async function fetchLatestTelemetry(arg) {
  const deviceId =
    typeof arg === "string"
      ? arg
      : arg && typeof arg === "object"
      ? arg.deviceId
      : undefined
      
      console.log("FETCH DEVICE ID:", deviceId)

  const params = new URLSearchParams()
  params.set("_", String(Date.now()))
  if (deviceId) params.append("device_id", deviceId)

  const res = await fetch(`${LIVE_BASE}/latest?${params.toString()}`, {
    headers: {
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Live telemetry failed (${res.status}) ${text}`)
  }

  const json = await res.json()

  // Lambda proxy support
  if (json && typeof json === "object" && typeof json.body === "string") {
    const parsed = tryParseJsonString(json.body)
    if (parsed) return parsed
  }

  return json
}

/* =========================================================
   HISTORICAL TELEMETRY (S3-backed via API Gateway)
========================================================= */

export async function fetchTelemetryRange({
  deviceId,
  startIso,
  endIso,
}) {
  if (!HIST_BASE) {
    throw new Error("Missing VITE_API_BASE_URL in .env")
  }

  if (!API_KEY) {
    throw new Error("Missing VITE_API_KEY in .env")
  }

  const url = new URL(`${HIST_BASE}/telemetry`)
  url.searchParams.set("device_id", deviceId)

  if (startIso) url.searchParams.set("start", startIso)
  if (endIso) url.searchParams.set("end", endIso)

  const res = await fetch(url.toString(), {
    headers: {
      "x-api-key": API_KEY,
      Accept: "application/json",
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Historical telemetry failed (${res.status}) ${text}`)
  }

  const text = await res.text()

  // 1️⃣ Try normal JSON
  try {
    const json = JSON.parse(text)

    // Lambda proxy case
    if (json && typeof json.body === "string") {
      const parsedBody = tryParseJsonString(json.body)
      if (parsedBody) return parsedBody
    }

    // If backend returns { data: [...] }
    if (Array.isArray(json?.data)) {
      return { data: json.data }
    }

    // If backend returns array directly
    if (Array.isArray(json)) {
      return { data: json }
    }

    return json
  } catch {
    // Not JSON → continue to NDJSON handling
  }

  // 2️⃣ NDJSON support
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const parsed = lines
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)

  return { data: parsed }
}
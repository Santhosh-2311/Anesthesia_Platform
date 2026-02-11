// src/telemetryAdapter.js

function toMs(ts) {
  const n = Number(ts)
  if (!Number.isFinite(n)) return Date.now()
  // seconds -> ms
  return n < 2_000_000_000 ? n * 1000 : n
}

function adaptPoint(p, deviceId) {
  if (!p || typeof p !== "object") return null

  const o2 = Number(p.o2)
  const n2o = Number(p.n2o)
  const air = Number(p.air)

  if (![o2, n2o, air].every(Number.isFinite)) return null

  const tsMs = toMs(p.ts)

  return {
    timestamp: tsMs,
    client_ts: tsMs,
    o2,
    n2o,
    air,
    deviceId: deviceId || ""
  }
}

export function adaptTelemetry(raw) {
  if (!raw || typeof raw !== "object") return null

  // ✅ NEW: API returns { device_id, count, latest_point: {...} }
  if (raw.latest_point) {
    return adaptPoint(raw.latest_point, raw.device_id)
  }

  // ✅ Older: API returns { device_id, count, points:[{...}] }
  if (Array.isArray(raw.points) && raw.points.length) {
    return adaptPoint(raw.points[raw.points.length - 1], raw.device_id)
  }

  // ✅ Single point {ts,o2,n2o,air} (with or without device_id)
  if ("o2" in raw && "n2o" in raw && "air" in raw) {
    return adaptPoint(raw, raw.device_id)
  }

  // ✅ Oldest: { gases:{o2,n2o,air}, ingested_at }
  if (raw.gases) {
    const o2 = Number(raw.gases.o2)
    const n2o = Number(raw.gases.n2o)
    const air = Number(raw.gases.air)

    if (![o2, n2o, air].every(Number.isFinite)) return null

    const t = Date.parse(raw.ingested_at)
    const tsMs = Number.isFinite(t) ? t : Date.now()

    return {
      timestamp: tsMs,
      client_ts: tsMs,
      o2,
      n2o,
      air,
      deviceId: raw.device_id || ""
    }
  }

  return null
}

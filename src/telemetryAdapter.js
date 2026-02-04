export function adaptTelemetry(raw) {
  // NEW backend point format may be:
  // A) { ts, uptime_ms, o2, n2o, air, device_id }
  // B) { ts, uptime_ms, gases: { o2, n2o, air }, device_id }

  if (raw && typeof raw === "object" && raw.ts != null) {
    const tsNum = Number(raw.ts)
    const tsMs = Number.isFinite(tsNum) ? tsNum * 1000 : NaN

    const gases = raw.gases && typeof raw.gases === "object" ? raw.gases : null

    const o2Val = gases?.o2 ?? raw.o2
    const n2oVal = gases?.n2o ?? raw.n2o
    const airVal = gases?.air ?? raw.air

    return {
      // ✅ what charts should use
      timestamp: Number.isFinite(tsMs) ? tsMs : Date.now(),

      // ✅ browser receive time (stable, always increases)
      client_ts: Date.now(),

      // ✅ used by App.jsx for sort/dedupe
      received_at: null,
      received_at_ms: Number.isFinite(tsMs) ? tsMs : null,

      // ✅ optional debug
      uptime_ms: raw.uptime_ms != null ? Number(raw.uptime_ms) : null,

      // ✅ gas values (avoid NaN if missing)
      o2: o2Val != null ? Number(o2Val) : null,
      n2o: n2oVal != null ? Number(n2oVal) : null,
      air: airVal != null ? Number(airVal) : null,

      deviceId: raw.device_id ?? raw.deviceId ?? null
    }
  }

  // OLD format fallback (if backend switches back)
  const receivedAtStr = raw?.received_at ?? null
  const receivedAtMs = receivedAtStr ? Date.parse(receivedAtStr) : NaN

  return {
    timestamp: Number.isFinite(receivedAtMs) ? receivedAtMs : Date.now(),
    client_ts: Date.now(),
    received_at: receivedAtStr,
    received_at_ms: Number.isFinite(receivedAtMs) ? receivedAtMs : null,
    o2: raw?.oxygen_percent != null ? Number(raw.oxygen_percent) : null,
    n2o: raw?.nitrous_percent != null ? Number(raw.nitrous_percent) : null,
    air: raw?.air_percent != null ? Number(raw.air_percent) : null,
    deviceId: raw?.device_id ?? null
  }
}

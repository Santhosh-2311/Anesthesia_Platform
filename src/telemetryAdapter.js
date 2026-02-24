// src/telemetryAdapter.js

function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function toString(v) {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length ? s : null
}

/**
 * Adapts backend payload:
 * {
 *   device_id,
 *   count,
 *   latest_point: {
 *     ts, uptime_ms,
 *     metrics: { "gas.fio2": 34.5, ... }
 *   }
 * }
 */
export function adaptLatestTelemetry(payload) {
  const lp = payload?.latest_point

  // ✅ If backend says count:0 and latest_point:null
  // return null so UI/hook can treat as NO DATA
  if (!lp) return null

  const metrics = lp.metrics || {}

  const tsSec = toNumber(lp.ts)
  const tsMs = tsSec ? Math.round(tsSec * 1000) : Date.now()

  return {
    deviceId: payload?.device_id ?? lp?.device_id ?? null,
    tsMs,
    uptimeMs: toNumber(lp.uptime_ms),

    // Gas mix (%)
    fio2: toNumber(metrics["gas.fio2"]),
    n2o: toNumber(metrics["gas.n2o_conc"]),
    air: toNumber(metrics["gas.air_conc"]),

    // Flow (L/min)
    o2Flow: toNumber(metrics["flow.o2_lpm"]),
    airFlow: toNumber(metrics["flow.air_lpm"]),
    n2oFlow: toNumber(metrics["flow.n2o_lpm"]),
    totalFlow: toNumber(metrics["flow.total_lpm"]),

    // Ventilator settings
    mode: toString(metrics["ventilator.mode"]),
    rrSet: toNumber(metrics["ventilator.rr_set"]),

    // Pressures (cmH2O)
    peep: toNumber(metrics["pressures.peep"]),
    pip: toNumber(metrics["pressures.pip"]),

    // Volumes
    vtSet: toNumber(metrics["volumes.vt_set_ml"]),
    vtMeasured: toNumber(metrics["volumes.vt_measured_ml"]),
    ieSet: toString(metrics["volumes.ie_set"]),
    tiSet: toNumber(metrics["volumes.ti_set_s"]),
    teSet: toNumber(metrics["volumes.te_set_s"]),

    // Line pressures (kPa)
    o2_kpa: toNumber(metrics["lines.main_high_pressure.o2_kpa"]),
    n2_kpa: toNumber(metrics["lines.main_high_pressure.n2_kpa"]),
    air_kpa: toNumber(metrics["lines.main_high_pressure.air_kpa"]),
  }
}

/**
 * ✅ Backward-compatible exports for old code
 * Some files import { adaptTelemetry } or { adaptLatestTelemetry }
 */
export const adaptTelemetry = adaptLatestTelemetry
export const adaptLatest = adaptLatestTelemetry
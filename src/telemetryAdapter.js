export function adaptTelemetry(raw) {
  // NEW backend format:
  // { device_id, count, latest_point: { ts, uptime_ms, metrics: { "gas.fio2": ..., ... } } }

  const latestPoint =
    raw?.latest_point && typeof raw.latest_point === "object"
      ? raw.latest_point
      : raw // allow passing latest_point directly if you want

  const metrics = latestPoint?.metrics && typeof latestPoint.metrics === "object"
    ? latestPoint.metrics
    : {}

  const tsNum = Number(latestPoint?.ts)
  const tsMs = Number.isFinite(tsNum) ? tsNum * 1000 : NaN

  // Helper to safely read numbers
  const num = (k) => {
    const v = metrics[k]
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  return {
    // charts/time
    timestamp: Number.isFinite(tsMs) ? tsMs : Date.now(),
    client_ts: Date.now(),

    // debug
    received_at: null,
    received_at_ms: Number.isFinite(tsMs) ? tsMs : null,
    uptime_ms: latestPoint?.uptime_ms != null ? Number(latestPoint.uptime_ms) : null,

    // device id
    deviceId: latestPoint?.device_id ?? raw?.device_id ?? null,

    // ====== gases (these replace your old o2/n2o/air %) ======
    fio2: num("gas.fio2"),
    n2o_conc: num("gas.n2o_conc"),
    air_conc: num("gas.air_conc"),

    // ====== flows ======
    o2_lpm: num("flow.o2_lpm"),
    air_lpm: num("flow.air_lpm"),
    n2o_lpm: num("flow.n2o_lpm"),
    total_lpm: num("flow.total_lpm"),

    // ====== ventilator ======
    vent_mode: metrics["ventilator.mode"] ?? null,
    rr_set: num("ventilator.rr_set"),

    // ====== pressures ======
    peep: num("pressures.peep"),
    pip: num("pressures.pip"),

    // ====== volumes ======
    vt_set_ml: num("volumes.vt_set_ml"),
    vt_measured_ml: num("volumes.vt_measured_ml"),
    ie_set: metrics["volumes.ie_set"] ?? null,
    ti_set_s: num("volumes.ti_set_s"),
    te_set_s: num("volumes.te_set_s"),

    // ====== lines ======
    line_o2_kpa: num("lines.main_high_pressure.o2_kpa"),
    line_n2_kpa: num("lines.main_high_pressure.n2_kpa"),
    line_air_kpa: num("lines.main_high_pressure.air_kpa")
  }
}

function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function toString(v) {
  if (v === null || v === undefined) return null

  const s = String(v).trim()

  return s.length ? s : null
}

export function adaptLatestTelemetry(payload) {

  console.log(
  "RAW PAYLOAD JSON:",
  JSON.stringify(payload, null, 2)
)
  // ---------------------------------------------------
  // SUPPORT BOTH:
  //
  // 1. Backend wrapped format
  // 2. Direct MQTT payload format
  // ---------------------------------------------------

  const data =
    payload?.latest_point ||
    payload

    const metrics = data?.metrics || {}

  if (!data) return null

  const tsSec =
    toNumber(data?.ts)

  const tsMs =
    tsSec
      ? tsSec * 1000
      : Date.now()

  const telemetry = {

  deviceId:
    data?.device_id ?? null,

  tsMs:
    toNumber(data?.ts) * 1000 || Date.now(),

  uptimeMs:
    toNumber(data?.uptime_ms),

  // GAS
  fio2:
    toNumber(metrics["gas.fio2"]),

  n2o:
    toNumber(metrics["gas.n2o_conc"]),

  air:
    toNumber(metrics["gas.air_conc"]),

  // FLOW
  o2Flow:
    toNumber(metrics["flow.o2_lpm"]),

  airFlow:
    toNumber(metrics["flow.air_lpm"]),

  n2oFlow:
    toNumber(metrics["flow.n2o_lpm"]),

  totalFlow:
    toNumber(metrics["flow.total_lpm"]),

  // VENTILATOR
  mode:
    toString(metrics["ventilator.mode"]),

  rrSet:
    toNumber(metrics["ventilator.rr_set"]),

  // PRESSURES
  peep:
    toNumber(metrics["pressures.peep"]),

  pip:
    toNumber(metrics["pressures.pip"]),

  // VOLUMES
  vtSet:
    toNumber(metrics["volumes.vt_set_ml"]),

  vtMeasured:
    toNumber(metrics["volumes.vt_measured_ml"]),

  ieSet:
    toString(metrics["volumes.ie_set"]),

  tiSet:
    toNumber(metrics["volumes.ti_set_s"]),

  teSet:
    toNumber(metrics["volumes.te_set_s"]),

    // CO2
etco2:
  toNumber(metrics["co2.etco2_mmhg"]),

  // LINE PRESSURES
  o2_kpa:
    toNumber(metrics["lines.main_high_pressure.o2_kpa"]),

  n2_kpa:
    toNumber(metrics["lines.main_high_pressure.n2_kpa"]),

  air_kpa:
    toNumber(metrics["lines.main_high_pressure.air_kpa"]),
}

  console.log("ADAPTED:", telemetry)

  return telemetry
}

export const adaptTelemetry = adaptLatestTelemetry

export const adaptLatest = adaptLatestTelemetry
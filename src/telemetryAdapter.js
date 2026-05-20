function toNumber(v) {
  const n = Number(v)

  return Number.isFinite(n)
    ? n
    : null
}

function toString(v) {
  if (v === null || v === undefined) {
    return null
  }

  const s = String(v).trim()

  return s.length
    ? s
    : null
}

export function adaptLatestTelemetry(payload) {

  console.log(
    "RAW PAYLOAD JSON:",
    JSON.stringify(payload, null, 2)
  )

  // ---------------------------------------------------
  // SUPPORT BOTH:
  //
  // 1. Backend REST format
  //    {
  //      latest_point: {...}
  //    }
  //
  // 2. OLD MQTT metrics format
  //    {
  //      metrics: {...}
  //    }
  //
  // 3. NEW nested MQTT format
  //    {
  //      gas: {...},
  //      flow: {...}
  //    }
  // ---------------------------------------------------

  if (!payload) {
    console.warn("No payload received")
    return null
  }

  const data =
    payload?.latest_point ||
    payload

  if (!data) {
    console.warn("No telemetry data found")
    return null
  }

  // ---------------------------------------------------
  // OLD FLAT METRICS FORMAT
  // ---------------------------------------------------

  const metrics =
    data?.metrics || {}

  // ---------------------------------------------------
  // NEW NESTED MQTT FORMAT
  // ---------------------------------------------------

  const gas =
    data?.gas || {}

  const flow =
    data?.flow || {}

  const ventilator =
    data?.ventilator || {}

  const pressures =
    data?.pressures || {}

  const volumes =
    data?.volumes || {}

  const co2 =
    data?.co2 || {}

  const linePressures =
    data?.lines?.main_high_pressure || {}

  const tsSec =
    toNumber(data?.ts)

  const telemetry = {

    // DEVICE

    deviceId:
      data?.device_id ?? null,

    tsMs:
      tsSec
        ? tsSec * 1000
        : Date.now(),

    uptimeMs:
      toNumber(data?.uptime_ms),

    // ---------------- GAS ----------------

    fio2:
      toNumber(
        gas?.fio2 ??
        metrics["gas.fio2"]
      ),

    n2o:
      toNumber(
        gas?.n2o_conc ??
        metrics["gas.n2o_conc"]
      ),

    air:
      toNumber(
        gas?.air_conc ??
        metrics["gas.air_conc"]
      ),

    // ---------------- FLOW ----------------

    o2Flow:
      toNumber(
        flow?.o2_lpm ??
        metrics["flow.o2_lpm"]
      ),

    airFlow:
      toNumber(
        flow?.air_lpm ??
        metrics["flow.air_lpm"]
      ),

    n2oFlow:
      toNumber(
        flow?.n2o_lpm ??
        metrics["flow.n2o_lpm"]
      ),

    totalFlow:
      toNumber(
        flow?.total_lpm ??
        metrics["flow.total_lpm"]
      ),

    // ------------- VENTILATOR -------------

    mode:
      toString(
        ventilator?.mode ??
        metrics["ventilator.mode"]
      ),

    rrSet:
      toNumber(
        ventilator?.rr_set ??
        metrics["ventilator.rr_set"]
      ),

    // ------------- PRESSURES -------------

    peep:
      toNumber(
        pressures?.peep ??
        metrics["pressures.peep"]
      ),

    pip:
      toNumber(
        pressures?.pip ??
        metrics["pressures.pip"]
      ),

    // -------------- VOLUMES --------------

    vtSet:
      toNumber(
        volumes?.vt_set_ml ??
        metrics["volumes.vt_set_ml"]
      ),

    vtMeasured:
      toNumber(
        volumes?.vt_measured_ml ??
        metrics["volumes.vt_measured_ml"]
      ),

    ieSet:
      toString(
        volumes?.ie_set ??
        metrics["volumes.ie_set"]
      ),

    tiSet:
      toNumber(
        volumes?.ti_set_s ??
        metrics["volumes.ti_set_s"]
      ),

    teSet:
      toNumber(
        volumes?.te_set_s ??
        metrics["volumes.te_set_s"]
      ),

    // ---------------- CO2 ----------------

    etco2:
      toNumber(
        co2?.etco2_mmhg ??
        metrics["co2.etco2_mmhg"]
      ),

    // ----------- LINE PRESSURES -----------

    o2_kpa:
      toNumber(
        linePressures?.o2_kpa ??
        metrics["lines.main_high_pressure.o2_kpa"]
      ),

    n2_kpa:
      toNumber(
        linePressures?.n2_kpa ??
        metrics["lines.main_high_pressure.n2_kpa"]
      ),

    air_kpa:
      toNumber(
        linePressures?.air_kpa ??
        metrics["lines.main_high_pressure.air_kpa"]
      ),
  }

  console.log("ADAPTED:", telemetry)

  return telemetry
}

// Backward compatibility exports
export const adaptTelemetry = adaptLatestTelemetry
export const adaptLatest = adaptLatestTelemetry
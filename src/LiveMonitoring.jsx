import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts"

/* =========================
   Utils
========================= */
function formatClockTime(ms) {
  if (!ms) return ""
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function num(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function fmt(v, dp = 1) {
  const n = num(v)
  if (n === null) return null
  if (dp === 0) return String(Math.round(n))
  return n.toFixed(dp)
}

function str(v) {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  return s.length ? s : null
}

function hasAnyClinicalValues(p) {
  if (!p) return false
  return (
    num(p.fio2) !== null ||
    num(p.n2o) !== null ||
    num(p.air) !== null ||
    num(p.totalFlow) !== null ||
    num(p.pip) !== null ||
    num(p.peep) !== null ||
    num(p.vtMeasured) !== null
  )
}

function getLastKnownKey(deviceId) {
  return `aw:lastKnownClinical:${deviceId || "unknown"}`
}

/* =========================
   ResizeObserver measure hook
   ✅ We will render LineChart with explicit width/height
   => NO ResponsiveContainer warnings ever
========================= */
function useMeasure() {
  const ref = useRef(null)
  const [rect, setRect] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!ref.current) return
    const el = ref.current

    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (!r) return
      const w = Math.max(0, Math.floor(r.width))
      const h = Math.max(0, Math.floor(r.height))
      setRect((prev) =>
        prev.width === w && prev.height === h ? prev : { width: w, height: h }
      )
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, rect]
}

/* =========================
   Small UI building blocks
========================= */
function ClinicalTile({ label, value, unit, state, dot, onClick, hint }) {
  const pretty = value === null || value === undefined ? null : value
  return (
    <button
      type="button"
      className={`clinicalTile ${state}`}
      onClick={onClick}
      title={hint}
    >
      <div className="tileTop">
        <div className="tileLabel">{label}</div>
        <div className={`tileDot ${dot}`} />
      </div>

      <div className="tileValueRow">
        <div className="tileValue">{pretty ?? "— —"}</div>
        <div className="tileUnit">{unit}</div>
      </div>

      {state !== "live" && (
        <div className="tileFoot">{state === "stale" ? "Last known" : "No data"}</div>
      )}
    </button>
  )
}

function KV({ k, v }) {
  return (
    <div className="kvRow">
      <div className="kvKey">{k}</div>
      <div className="kvVal">{v ?? "—"}</div>
    </div>
  )
}

/* =========================
   Chart wrapper (NO ResponsiveContainer)
========================= */
function ChartCard({ title, height = 300, children }) {
  const [wrapRef, rect] = useMeasure()
  const ready = rect.width > 50 && rect.height > 50

  return (
    <div className="card">
      <div className="cardTitle">{title}</div>

      <div ref={wrapRef} className="chartWrap" style={{ height }}>
        {ready ? (
          children({ width: rect.width, height: rect.height })
        ) : (
          <div className="muted" style={{ padding: 12 }}>Preparing chart…</div>
        )}
      </div>
    </div>
  )
}

export default function LiveMonitoring({ latest, telemetry = [], status, lastUpdateMs }) {
  const navigate = useNavigate()
  const { groupId, deviceId } = useParams()

  const isLive = Boolean(status?.isLive)

  const lastUpdateText = useMemo(() => {
    if (!lastUpdateMs) return "—"
    const sec = Math.max(0, Math.round((Date.now() - lastUpdateMs) / 1000))
    return `${sec}s ago`
  }, [lastUpdateMs])

  /* =========================
     Cache last-known snapshot
  ========================= */
  const lastKnownKey = useMemo(() => getLastKnownKey(deviceId), [deviceId])

  useEffect(() => {
    if (!latest || !hasAnyClinicalValues(latest)) return
    const snapshot = {
      tsMs: latest.tsMs ?? latest.timestamp ?? Date.now(),

      fio2: latest.fio2,
      n2o: latest.n2o,
      air: latest.air,
      totalFlow: latest.totalFlow,
      pip: latest.pip,
      peep: latest.peep,
      vtMeasured: latest.vtMeasured,

      mode: latest.mode,
      rrSet: latest.rrSet,
      vtSet: latest.vtSet,
      ieSet: latest.ieSet,
      tiSet: latest.tiSet,
      teSet: latest.teSet,

      o2_kpa: latest.o2_kpa,
      n2_kpa: latest.n2_kpa,
      air_kpa: latest.air_kpa,
    }
    try {
      localStorage.setItem(lastKnownKey, JSON.stringify(snapshot))
    } catch {
      // ignore
    }
  }, [latest, lastKnownKey])

  const lastKnown = useMemo(() => {
    try {
      const raw = localStorage.getItem(lastKnownKey)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [lastKnownKey])

  const display = latest && typeof latest === "object" ? latest : lastKnown || {}

  function goMetric(metricKey) {
    navigate(`/groups/${groupId}/devices/${deviceId}/metric/${metricKey}`, {
      state: { telemetry, latest },
    })
  }

  /* =========================
     Chart series
  ========================= */
  const gasData = useMemo(
    () =>
      telemetry.map((p) => ({
        tsMs: p.tsMs,
        fio2: num(p.fio2),
        n2o: num(p.n2o),
        air: num(p.air),
      })),
    [telemetry]
  )

  const flowData = useMemo(
    () =>
      telemetry.map((p) => ({
        tsMs: p.tsMs,
        totalFlow: num(p.totalFlow),
        o2Flow: num(p.o2Flow),
        airFlow: num(p.airFlow),
        n2oFlow: num(p.n2oFlow),
      })),
    [telemetry]
  )

  const pressureData = useMemo(
    () =>
      telemetry.map((p) => ({
        tsMs: p.tsMs,
        pip: num(p.pip),
        peep: num(p.peep),
      })),
    [telemetry]
  )

  const vtData = useMemo(
    () =>
      telemetry.map((p) => ({
        tsMs: p.tsMs,
        vtMeasured: num(p.vtMeasured),
      })),
    [telemetry]
  )

  /* =========================
     Clinical tiles
  ========================= */
  const fio2Val = fmt(display?.fio2, 1)
  const n2oVal = fmt(display?.n2o, 1)
  const airVal = fmt(display?.air, 1)
  const totalFlowVal = fmt(display?.totalFlow, 2)
  const pipVal = fmt(display?.pip, 0)
  const peepVal = fmt(display?.peep, 0)
  const vtVal = fmt(display?.vtMeasured, 0)

  const tileHasAny =
    fio2Val !== null ||
    n2oVal !== null ||
    airVal !== null ||
    totalFlowVal !== null ||
    pipVal !== null ||
    peepVal !== null ||
    vtVal !== null

  const tileState = isLive ? "live" : tileHasAny ? "stale" : "empty"
  const dotState = isLive ? "live" : "offline"

  /* =========================
     Panels (settings + supply)
  ========================= */
  const mode = str(display?.mode)
  const rrSet = fmt(display?.rrSet, 0)
  const vtSet = fmt(display?.vtSet, 0)
  const ieSet = str(display?.ieSet)
  const tiSet = fmt(display?.tiSet, 1)
  const teSet = fmt(display?.teSet, 1)

  const o2kpa = fmt(display?.o2_kpa, 1)
  const n2kpa = fmt(display?.n2_kpa, 1)
  const airkpa = fmt(display?.air_kpa, 1)

  const modeHistory = useMemo(() => {
    const out = []
    let last = null
    for (let i = telemetry.length - 1; i >= 0; i--) {
      const m = str(telemetry[i]?.mode)
      const tsMs = telemetry[i]?.tsMs
      if (!m || !tsMs) continue
      if (m !== last) {
        out.push({ tsMs, mode: m })
        last = m
      }
      if (out.length >= 6) break
    }
    return out
  }, [telemetry])

  return (
    <div>
      <div className="pageHeaderRow">
        <div>
          <h1 className="titleBig">
            Live Monitoring — <span className="mono">{deviceId}</span>
          </h1>
          {/* <div className="muted">Backend device_id: (mapped in LiveTelemetry)</div> */}
        </div>

        <div className="statusRow">
          <span className={`pill ${status?.isLive ? "pillLive" : "pillOff"}`}>
            {status?.tag || "OFFLINE"}
          </span>
          <span className="muted">Last update: {lastUpdateText}</span>
          {mode ? <span className="pill pillMode">Mode: {mode}</span> : null}
        </div>
      </div>

      <h3 className="sectionTitle">Clinical Overview</h3>

      <div className="clinicalGrid">
        <ClinicalTile label="FiO₂" value={fio2Val} unit="%" state={tileState} dot={dotState} onClick={() => goMetric("fio2")} hint="Open FiO₂ trend" />
        <ClinicalTile label="N₂O" value={n2oVal} unit="%" state={tileState} dot={dotState} onClick={() => goMetric("n2o")} hint="Open N₂O trend" />
        <ClinicalTile label="Air" value={airVal} unit="%" state={tileState} dot={dotState} onClick={() => goMetric("air")} hint="Open Air trend" />
        <ClinicalTile label="Total Flow" value={totalFlowVal} unit="L/min" state={tileState} dot={dotState} onClick={() => goMetric("totalFlow")} hint="Open Total Flow trend" />
        <ClinicalTile label="PIP" value={pipVal} unit="cmH₂O" state={tileState} dot={dotState} onClick={() => goMetric("pip")} hint="Open PIP trend" />
        <ClinicalTile label="PEEP" value={peepVal} unit="cmH₂O" state={tileState} dot={dotState} onClick={() => goMetric("peep")} hint="Open PEEP trend" />
        <ClinicalTile label="VT Measured" value={vtVal} unit="mL" state={tileState} dot={dotState} onClick={() => goMetric("vtMeasured")} hint="Open VT trend" />
      </div>

      <div className="grid2" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="cardTitle">Ventilator Settings</div>

          <div className="kvGrid" style={{ marginTop: 10 }}>
            <KV k="Mode" v={mode} />
            <KV k="RR Set" v={rrSet ? `${rrSet} bpm` : null} />
            <KV k="VT Set" v={vtSet ? `${vtSet} mL` : null} />
            <KV k="I:E Set" v={ieSet} />
            <KV k="Ti Set" v={tiSet ? `${tiSet} s` : null} />
            <KV k="Te Set" v={teSet ? `${teSet} s` : null} />
          </div>

          {modeHistory.length > 0 ? (
            <div style={{ marginTop: 12 }}>
              <div className="muted" style={{ fontWeight: 800, fontSize: 12, marginBottom: 6 }}>
                Recent mode changes
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {modeHistory.map((x) => (
                    <tr key={x.tsMs}>
                      <td className="mono">{formatClockTime(x.tsMs)}</td>
                      <td><span className="pill pillMode">{x.mode}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="muted" style={{ marginTop: 10 }}>
              No mode history yet.
            </div>
          )}
        </div>

        <div className="card">
          <div
            className="cardTitle"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>Supply Summary</span>
            <button
              type="button"
              className="linkBtn"
              onClick={() => navigate(`/groups/${groupId}/devices/${deviceId}/diagnostics`)}
            >
              Open Diagnostics →
            </button>
          </div>

          <div className="kvGrid" style={{ marginTop: 10 }}>
            <KV k="O₂ Line High Pressure" v={o2kpa ? `${o2kpa} kPa` : null} />
            <KV k="N₂ Line High Pressure" v={n2kpa ? `${n2kpa} kPa` : null} />
            <KV k="Air Line High Pressure" v={airkpa ? `${airkpa} kPa` : null} />
          </div>

          <div className="muted" style={{ marginTop: 10 }}>
            Detailed supply diagnostics (alarms/limits/history) are on the Diagnostics page.
          </div>
        </div>
      </div>

      <h3 className="sectionTitle" style={{ marginTop: 18 }}>
        Trends
      </h3>

      <div className="chartsGrid">
        <ChartCard title="Gas Mix Trend">
          {({ width, height }) => (
            <LineChart width={width} height={height} data={gasData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="tsMs"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatClockTime}
                minTickGap={28}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip labelFormatter={(v) => formatClockTime(v)} />
              <Legend />
              <Line type="monotone" dataKey="air" name="Air (%)" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="fio2" name="FiO₂ (%)" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="n2o" name="N₂O (%)" dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ChartCard>

        <ChartCard title="Flow Trend">
          {({ width, height }) => (
            <LineChart width={width} height={height} data={flowData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="tsMs"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatClockTime}
                minTickGap={28}
              />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip labelFormatter={(v) => formatClockTime(v)} />
              <Legend />
              <Line type="monotone" dataKey="airFlow" name="Air (L/min)" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="n2oFlow" name="N₂O (L/min)" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="o2Flow" name="O₂ (L/min)" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="totalFlow" name="Total (L/min)" dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ChartCard>

        <ChartCard title="Pressure Trend">
          {({ width, height }) => (
            <LineChart width={width} height={height} data={pressureData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="tsMs"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatClockTime}
                minTickGap={28}
              />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip labelFormatter={(v) => formatClockTime(v)} />
              <Legend />
              <Line type="monotone" dataKey="peep" name="PEEP (cmH₂O)" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="pip" name="PIP (cmH₂O)" dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ChartCard>

        <ChartCard title="VT Trend">
          {({ width, height }) => (
            <LineChart width={width} height={height} data={vtData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="tsMs"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={formatClockTime}
                minTickGap={28}
              />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip labelFormatter={(v) => formatClockTime(v)} />
              <Legend />
              <Line type="monotone" dataKey="vtMeasured" name="VT Measured (mL)" dot={false} isAnimationActive={false} />
            </LineChart>
          )}
        </ChartCard>
      </div>
    </div>
  )
}

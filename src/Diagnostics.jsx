import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { fetchLatestTelemetry } from "./api/telemetry"
import { adaptTelemetry } from "./telemetryAdapter"
import { mapUiDeviceToBackend } from "./deviceMap"

export default function Diagnostics() {
  const navigate = useNavigate()
  const { groupId, deviceId } = useParams()
  const backendDeviceId = useMemo(() => mapUiDeviceToBackend(deviceId), [deviceId])

  const [latest, setLatest] = useState(null)
  const [err, setErr] = useState(null)
  const [lastUpdateMs, setLastUpdateMs] = useState(0)

  useEffect(() => {
    let alive = true
    const run = async () => {
      try {
        const api = await fetchLatestTelemetry({ deviceId: backendDeviceId })
        const pt = adaptTelemetry(api)
        if (!alive) return
        setLatest(pt)
        setErr(null)
        setLastUpdateMs(Date.now())
      } catch (e) {
        if (!alive) return
        setErr(e?.message || "Diagnostics fetch failed")
      }
    }
    run()
    const id = setInterval(run, 1500)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [backendDeviceId])

  const lastUpdateText = useMemo(() => {
    if (!lastUpdateMs) return "—"
    const sec = Math.max(0, Math.round((Date.now() - lastUpdateMs) / 1000))
    return `${sec}s ago`
  }, [lastUpdateMs])

  return (
    <div>
      <div className="pageHeaderRow">
        <h1 className="titleBig">
          Diagnostics — <span className="mono">{deviceId}</span>
        </h1>

        <div className="statusRow">
          <span className="muted">Last update: {lastUpdateText}</span>
          <button
            type="button"
            className="linkBtn"
            onClick={() => navigate(`/groups/${groupId}/devices/${deviceId}/live`)}
          >
            ← Back to Live
          </button>
        </div>
      </div>

      {err ? (
        <div className="banner warn">
          Error: <span className="mono">{err}</span>
        </div>
      ) : null}

      <div className="card">
        <div className="kvGrid">
          <div className="kvRow">
            <div className="kvKey">O₂ line high pressure (kPa)</div>
            <div className="kvVal">{latest?.o2_kpa ?? "--"}</div>
          </div>
          <div className="kvRow">
            <div className="kvKey">N₂ line high pressure (kPa)</div>
            <div className="kvVal">{latest?.n2_kpa ?? "--"}</div>
          </div>
          <div className="kvRow">
            <div className="kvKey">Air line high pressure (kPa)</div>
            <div className="kvVal">{latest?.air_kpa ?? "--"}</div>
          </div>
          <div className="kvRow">
            <div className="kvKey">Uptime (ms)</div>
            <div className="kvVal">{latest?.uptime_ms ?? "--"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

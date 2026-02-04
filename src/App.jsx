import { useState, useEffect } from "react"
import Login from "./Login"
import Dashboard from "./Dashboard"
import Analytics from "./Analytics"
import Sidebar from "./Sidebar"
import TopBar from "./TopBar"
import LiveMonitoring from "./LiveMonitoring"
import { adaptTelemetry } from "./telemetryAdapter"

function App() {
  const [telemetry, setTelemetry] = useState([])
  const [latest, setLatest] = useState(null)
  const [user, setUser] = useState(null)
  const [activePage, setActivePage] = useState("dashboard")

  // ✅ NEW: stale/offline tracking
  const [lastNewSampleAt, setLastNewSampleAt] = useState(null)
  const [streamStatus, setStreamStatus] = useState("OFFLINE") // LIVE | STALE | OFFLINE

  useEffect(() => {
    if (!user) return

    let alive = true
    let timeoutId = null
    let inFlight = false
    let backoffMs = 1000
    const controller = new AbortController()

    const poll = async () => {
      if (!alive || inFlight) return
      inFlight = true

      try {
        const url =
          "https://tdeoo8mxk3.execute-api.ap-south-1.amazonaws.com/latest" +
          "?ts=" +
          Date.now()

        const res = await fetch(url, {
          signal: controller.signal,
          cache: "no-store"
        })

        if (!res.ok) {
          if (res.status === 503 || res.status === 429) {
            backoffMs = Math.min(backoffMs * 2, 15000)
          } else {
            backoffMs = Math.min(backoffMs + 1000, 15000)
          }
          return
        }

        const json = await res.json()
        console.log("RAW JSON (full response):", json)

        const points = Array.isArray(json?.points) ? json.points : []
        if (!points.length) return

        setTelemetry((prev) => {
          const lastPrevMs =
            prev.length
              ? (prev[prev.length - 1].received_at_ms ?? -Infinity)
              : -Infinity

          const enriched = points.map((p) => ({
            ...p,
            device_id: json?.device_id ?? p?.device_id ?? null
          }))

          const mapped = enriched
            .map(adaptTelemetry)
            .filter((p) => Number.isFinite(p.received_at_ms))
            .sort((a, b) => a.received_at_ms - b.received_at_ms)
            .filter((p) => p.received_at_ms > lastPrevMs)

          if (!mapped.length) return prev

          // ✅ NEW: mark real arrival of new data
          setLatest(mapped[mapped.length - 1])
          setLastNewSampleAt(Date.now())
          backoffMs = 1000

          return [...prev, ...mapped].slice(-600)
        })
      } catch (e) {
        backoffMs = Math.min(backoffMs * 2, 15000)
      } finally {
        inFlight = false
        if (alive) {
          timeoutId = setTimeout(poll, backoffMs)
        }
      }
    }

    poll()

    return () => {
      alive = false
      if (timeoutId) clearTimeout(timeoutId)
      controller.abort()
    }
  }, [user])

  // ✅ NEW: derive LIVE / STALE / OFFLINE
  useEffect(() => {
    const id = setInterval(() => {
      if (!lastNewSampleAt) {
        setStreamStatus("OFFLINE")
        return
      }

      const age = Date.now() - lastNewSampleAt

      if (age > 30000) setStreamStatus("OFFLINE")
      else if (age > 5000) setStreamStatus("STALE")
      else setStreamStatus("LIVE")
    }, 500)

    return () => clearInterval(id)
  }, [lastNewSampleAt])

  return (
    <>
      {user ? (
        <div className="app-layout">
          <Sidebar active={activePage} role={user.role} onNavigate={setActivePage} />

          <div style={{ flex: 1 }}>
            <TopBar
              user={user}
              onLogout={() => {
                setUser(null)
                setActivePage("dashboard")
                setTelemetry([])
                setLatest(null)
                setLastNewSampleAt(null)
                setStreamStatus("OFFLINE")
              }}
            />

            <div className="main-content">
              {activePage === "dashboard" && <Dashboard data={telemetry} />}

              {activePage === "live" && (
                <LiveMonitoring
                  telemetry={telemetry}
                  latest={latest}
                  status={streamStatus} // ✅ pass status
                />
              )}

              {activePage === "analytics" && user.role === "ADMIN" && <Analytics />}

              {activePage === "devices" && (
                <div className="container">
                  <h2>Devices</h2>
                  <p>Device status and metadata view.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <Login onLogin={setUser} />
      )}
    </>
  )
}

export default App

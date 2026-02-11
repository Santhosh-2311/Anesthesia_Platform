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
          "?_=" +
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

        const lp = json?.latest_point
        if (!lp) return

        const t = adaptTelemetry(json) // adapter expects { latest_point, device_id, ... }

        setTelemetry((prev) => {
          const last = prev.length ? prev[prev.length - 1] : null
          const lastMs = last?.received_at_ms ?? -Infinity

          // Only append if backend ts advanced
          if (t.received_at_ms != null && t.received_at_ms <= lastMs) {
            // still update "latest" so UI doesn't freeze if values changed without ts (rare)
            setLatest(t)
            backoffMs = 1000
            return prev
          }

          setLatest(t)
          backoffMs = 1000
          return [...prev, t].slice(-600)
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
              }}
            />

            <div className="main-content">
              {activePage === "dashboard" && <Dashboard data={telemetry} />}

              {activePage === "live" && (
                <LiveMonitoring telemetry={telemetry} latest={latest} />
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

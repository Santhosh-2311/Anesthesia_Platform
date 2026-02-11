import { Navigate, Route, Routes, Link, useParams } from "react-router-dom"
import Sidebar from "./Sidebar"
import TopBar from "./TopBar"
import Login from "./Login"
import LiveTelemetryWrapper from "./LiveTelemetryWrapper"

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar />
        <div className="app-content">{children}</div>
      </div>
    </div>
  )
}

function RequireAuth({ children }) {
  const ok = localStorage.getItem("loggedIn") === "1"
  return ok ? children : <Navigate to="/login" replace />
}

const GROUPS = [
  { id: "anesthesia-workstation", name: "Anesthesia Workstation", description: "Gas monitoring + device health" },
  { id: "icu-monitor", name: "ICU Monitor", description: "Coming soon" },
  { id: "ventilator", name: "Ventilator", description: "Coming soon" }
]

// ✅ Temporary devices only for anesthesia-workstation (until backend is ready)
const TEMP_DEVICES_BY_GROUP = {
  "anesthesia-workstation": [
    { id: "AW-001", name: "OT-1 Workstation", location: "OT-1", status: "unknown" },
    { id: "AW-002", name: "OT-2 Workstation", location: "OT-2", status: "unknown" }
  ]
}

function GroupsPage() {
  return (
    <AppShell>
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Device Groups</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {GROUPS.map((g) => (
            <Link
              key={g.id}
              to={`/groups/${g.id}/devices`}
              style={{
                textDecoration: "none",
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 16,
                background: "white",
                color: "#111827"
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16 }}>{g.name}</div>
              <div style={{ marginTop: 6, color: "#6b7280" }}>{g.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function GroupDevicesPage() {
  const { groupId } = useParams()
  const group = GROUPS.find((g) => g.id === groupId)
  const devices = TEMP_DEVICES_BY_GROUP[groupId] || []

  return (
    <AppShell>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0 }}>{group?.name || "Devices"}</h2>
          <Link to="/groups" style={{ color: "#2563eb", textDecoration: "none" }}>
            ← Back to groups
          </Link>
        </div>

        {devices.length === 0 ? (
          <div style={{ marginTop: 14, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Under construction</h3>
            <p style={{ color: "#6b7280", marginBottom: 0 }}>
              No devices configured yet for this group.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: 14, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 120px",
                padding: 12,
                fontWeight: 700,
                borderBottom: "1px solid #e5e7eb"
              }}
            >
              <div>Name</div>
              <div>Location</div>
              <div>Status</div>
              <div />
            </div>

            {devices.map((d) => (
              <div
                key={d.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 120px",
                  padding: 12,
                  borderBottom: "1px solid #f3f4f6"
                }}
              >
                <div>
                  {d.name} <span style={{ color: "#6b7280" }}>({d.id})</span>
                </div>
                <div>{d.location}</div>
                <div>{d.status}</div>
                <div>
                  <Link to={`/groups/${groupId}/devices/${d.id}/live`} style={{ color: "#2563eb" }}>
                    View Live
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function DeviceLivePage() {
  const { groupId, deviceId } = useParams()

  return (
    <AppShell>
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>{deviceId}</h2>
            <div style={{ color: "#6b7280", marginTop: 4 }}>{groupId}</div>
          </div>
          <Link to={`/groups/${groupId}/devices`} style={{ color: "#2563eb", textDecoration: "none" }}>
            ← Back to devices
          </Link>
        </div>

        <div style={{ marginTop: 14, background: "white", border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <LiveTelemetryWrapper />
        </div>
      </div>
    </AppShell>
  )
}

function NotFound() {
  return (
    <AppShell>
      <div style={{ padding: 24 }}>Not Found</div>
    </AppShell>
  )
}

export default function App() {
  return (
    <Routes>
      {/* Root -> login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route
        path="/groups"
        element={
          <RequireAuth>
            <GroupsPage />
          </RequireAuth>
        }
      />

      <Route
        path="/groups/:groupId/devices"
        element={
          <RequireAuth>
            <GroupDevicesPage />
          </RequireAuth>
        }
      />

      <Route
        path="/groups/:groupId/devices/:deviceId/live"
        element={
          <RequireAuth>
            <DeviceLivePage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

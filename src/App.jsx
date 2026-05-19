import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom"

import Login from "./Login"
import Sidebar from "./Sidebar"

import Dashboard from "./Dashboard"
import Devices from "./Devices"
import LiveTelemetry from "./LiveTelemetry"
import Diagnostics from "./Diagnostics"
import Analytics from "./Analytics"
import MetricTrend from "./MetricTrend"

import HistoricalTrends from "./HistoricalTrends"
import HistoricalMetricTrend from "./HistoricalMetricTrend"

import "./App.css"

function AppShell({ children }) {

  return (
    <div className="app-shell">

      <Sidebar />

      <div className="app-main">

        <div className="app-content">
          {children}
        </div>

      </div>
    </div>
  )
}
function RequireAuth({ children }) {
  const loggedIn = localStorage.getItem("loggedIn") === "1"

  return loggedIn ? children : <Navigate to="/login" replace />
}

function RootRedirect() {
  const loggedIn = localStorage.getItem("loggedIn") === "1"

  return (
    <Navigate
      to={loggedIn ? "/dashboard" : "/login"}
      replace
    />
  )
}

function NotFoundRedirect() {
  const loggedIn = localStorage.getItem("loggedIn") === "1"

  return (
    <Navigate
      to={loggedIn ? "/dashboard" : "/login"}
      replace
    />
  )
}

function DiagnosticsRedirect() {
  const deviceId =
    localStorage.getItem("selectedDeviceId") ||
    "AW-1001"

  return (
    <Navigate
      to={`/devices/${deviceId}/diagnostics`}
      replace
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      <Route path="/login" element={<Login />} />

      {/* DASHBOARD */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <AppShell>
              <Dashboard />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* DEVICE LIST */}
      <Route
        path="/devices"
        element={
          <RequireAuth>
            <AppShell>
              <Devices />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* LIVE MONITORING */}
      <Route
        path="/devices/:deviceId/live"
        element={
          <RequireAuth>
            <AppShell>
              <LiveTelemetry />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* LIVE METRIC */}
      <Route
        path="/devices/:deviceId/metric/:metricKey"
        element={
          <RequireAuth>
            <AppShell>
              <MetricTrend />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* HISTORY */}
      <Route
        path="/devices/:deviceId/history"
        element={
          <RequireAuth>
            <AppShell>
              <HistoricalTrends />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* HISTORY METRIC */}
      <Route
        path="/devices/:deviceId/history/:metricKey"
        element={
          <RequireAuth>
            <AppShell>
              <HistoricalMetricTrend />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* DIAGNOSTICS */}
      <Route
        path="/devices/:deviceId/diagnostics"
        element={
          <RequireAuth>
            <AppShell>
              <Diagnostics />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* ANALYTICS */}
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <AppShell>
              <Analytics />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* DIAGNOSTICS ALIAS */}
      <Route
        path="/diagnostics"
        element={
          <RequireAuth>
            <DiagnosticsRedirect />
          </RequireAuth>
        }
      />

      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  )
}
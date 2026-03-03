import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./Login"
import Sidebar from "./Sidebar"
import TopBar from "./TopBar"

import Dashboard from "./Dashboard"
import Devices from "./Devices"
import LiveTelemetry from "./LiveTelemetry"
import Diagnostics from "./Diagnostics"
import Analytics from "./Analytics"
import MetricTrend from "./MetricTrend"

// ✅ NEW: Historical pages
import HistoricalTrends from "./HistoricalTrends"
import HistoricalMetricTrend from "./HistoricalMetricTrend"

import "./App.css"

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
  const loggedIn = localStorage.getItem("loggedIn") === "1"
  return loggedIn ? children : <Navigate to="/login" replace />
}

function RootRedirect() {
  const loggedIn = localStorage.getItem("loggedIn") === "1"
  return <Navigate to={loggedIn ? "/groups" : "/login"} replace />
}

function NotFoundRedirect() {
  const loggedIn = localStorage.getItem("loggedIn") === "1"
  return <Navigate to={loggedIn ? "/groups" : "/login"} replace />
}

function DiagnosticsRedirect() {
  const groupId =
    localStorage.getItem("selectedGroupId") || "anesthesia-workstation"
  const deviceId = localStorage.getItem("selectedDeviceId") || "AW-001"
  return (
    <Navigate
      to={`/groups/${groupId}/devices/${deviceId}/diagnostics`}
      replace
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/groups"
        element={
          <RequireAuth>
            <AppShell>
              <Dashboard />
            </AppShell>
          </RequireAuth>
        }
      />

      <Route
        path="/groups/:groupId/devices"
        element={
          <RequireAuth>
            <AppShell>
              <Devices />
            </AppShell>
          </RequireAuth>
        }
      />

      <Route
        path="/groups/:groupId/devices/:deviceId/live"
        element={
          <RequireAuth>
            <AppShell>
              <LiveTelemetry />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Single-metric LIVE trend page (opened by clicking tiles) */}
      <Route
        path="/groups/:groupId/devices/:deviceId/metric/:metricKey"
        element={
          <RequireAuth>
            <AppShell>
              <MetricTrend />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* ✅ NEW: Historical dashboard */}
      <Route
        path="/groups/:groupId/devices/:deviceId/history"
        element={
          <RequireAuth>
            <AppShell>
              <HistoricalTrends />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* ✅ NEW: Historical single metric */}
      <Route
        path="/groups/:groupId/devices/:deviceId/history/:metricKey"
        element={
          <RequireAuth>
            <AppShell>
              <HistoricalMetricTrend />
            </AppShell>
          </RequireAuth>
        }
      />

      <Route
        path="/groups/:groupId/devices/:deviceId/diagnostics"
        element={
          <RequireAuth>
            <AppShell>
              <Diagnostics />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Alias so /diagnostics works too */}
      <Route
        path="/diagnostics"
        element={
          <RequireAuth>
            <DiagnosticsRedirect />
          </RequireAuth>
        }
      />

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

      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  )
}
import { NavLink, useLocation, useParams } from "react-router-dom"

// Fallback defaults (so sidebar links don't break)
const DEFAULT_GROUP = "anesthesia-workstation"
const DEFAULT_DEVICE = "AW-001"

export default function Sidebar() {
  const location = useLocation()
  const params = useParams()

  // Try to infer current group/device from URL first,
  // else fallback to localStorage, else default.
  const groupId =
    params.groupId || localStorage.getItem("selectedGroupId") || DEFAULT_GROUP

  const deviceId =
    params.deviceId || localStorage.getItem("selectedDeviceId") || DEFAULT_DEVICE

  // Exclusive active matching (prevents multiple items highlighted)
  const isGroupsRoot = location.pathname === "/groups"

  const isDevicesPage = new RegExp(`^/groups/${groupId}/devices$`).test(
    location.pathname
  )

  const isLivePage = new RegExp(`^/groups/${groupId}/devices/[^/]+/live$`).test(
    location.pathname
  )

  // ✅ NEW: history pages (both dashboard and single metric)
  const isHistoryPage = new RegExp(
    `^/groups/${groupId}/devices/[^/]+/history(/[^/]+)?$`
  ).test(location.pathname)

  const isDiagnosticsPage = new RegExp(
    `^/groups/${groupId}/devices/[^/]+/diagnostics$`
  ).test(location.pathname)

  const isAnalyticsPage = location.pathname === "/analytics"

  const cls = (on) => `sidebar-item ${on ? "active" : ""}`

  return (
    <div className="sidebar">
      <NavLink to="/groups" className={cls(isGroupsRoot)}>
        Device Groups
      </NavLink>

      <NavLink to={`/groups/${groupId}/devices`} className={cls(isDevicesPage)}>
        Devices
      </NavLink>

      <NavLink
        to={`/groups/${groupId}/devices/${deviceId}/live`}
        className={cls(isLivePage)}
      >
        Live Monitoring
      </NavLink>

      {/* ✅ NEW */}
      <NavLink
        to={`/groups/${groupId}/devices/${deviceId}/history`}
        className={cls(isHistoryPage)}
      >
        Historical Trends
      </NavLink>

      <NavLink
        to={`/groups/${groupId}/devices/${deviceId}/diagnostics`}
        className={cls(isDiagnosticsPage)}
      >
        Diagnostics
      </NavLink>

      <NavLink to="/analytics" className={cls(isAnalyticsPage)}>
        Analytics
      </NavLink>
    </div>
  )
}
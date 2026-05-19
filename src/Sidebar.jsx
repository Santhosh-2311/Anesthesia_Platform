import { useState } from "react"
import {
  NavLink,
  useLocation,
} from "react-router-dom"

import {
  ChevronDown,
  ChevronRight,
} from "lucide-react"

export default function Sidebar() {
  const [deviceOpen, setDeviceOpen] =
    useState(true)

  const location = useLocation()

  const deviceSectionActive =
    location.pathname.startsWith("/devices")

  const cls = ({ isActive }) =>
    `enterprise-sidebar-item ${
      isActive ? "active" : ""
    }`

  return (
    <div className="enterprise-sidebar">
      <div className="sidebar-logo">
        THYNKURE
      </div>

      {/* DASHBOARD */}
      <NavLink
        to="/dashboard"
        className={cls}
      >
        Dashboard
      </NavLink>

      {/* DEVICE SECTION */}
      <button
        className={`sidebar-dropdown-btn ${
          deviceOpen || deviceSectionActive
            ? "open"
            : ""
        }`}
        onClick={() =>
          setDeviceOpen(!deviceOpen)
        }
      >
        <span>Device</span>

        {deviceOpen ? (
          <ChevronDown size={16} />
        ) : (
          <ChevronRight size={16} />
        )}
      </button>

      {deviceOpen && (
        <div className="sidebar-submenu">
          <NavLink
            to="/devices"
            className={cls}
          >
            Device List
          </NavLink>

          <NavLink
            to="/devices/add"
            className={cls}
          >
            Add Device
          </NavLink>
        </div>
      )}
    </div>
  )
}
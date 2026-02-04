function Sidebar({ active, role, onNavigate }) {
  return (
    <div className="sidebar">
      <div
        className={`sidebar-item ${active === "dashboard" ? "active" : ""}`}
        onClick={() => onNavigate("dashboard")}
      >
        Dashboard
      </div>

      <div
        className={`sidebar-item ${active === "live" ? "active" : ""}`}
        onClick={() => onNavigate("live")}
      >
        Live Monitoring
      </div>

      <div
        className={`sidebar-item ${active === "devices" ? "active" : ""}`}
        onClick={() => onNavigate("devices")}
      >
        Devices
      </div>

      {/* ADMIN ONLY */}
      {role === "ADMIN" && (
        <div
          className={`sidebar-item ${active === "analytics" ? "active" : ""}`}
          onClick={() => onNavigate("analytics")}
        >
          Analytics
        </div>
      )}
    </div>
  )
}

export default Sidebar

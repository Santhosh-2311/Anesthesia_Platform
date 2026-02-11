import { Link, useLocation, useParams, useNavigate } from "react-router-dom"

function Breadcrumbs() {
  const location = useLocation()
  const { groupId, deviceId } = useParams()

  // (kept for future use; safe even if unused)
  location.pathname.split("/").filter(Boolean)

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
      <Link to="/groups" style={{ textDecoration: "none", color: "#2563eb" }}>
        Device Groups
      </Link>

      {groupId && (
        <>
          <span style={{ color: "#9ca3af" }}>/</span>
          <Link
            to={`/groups/${groupId}/devices`}
            style={{ textDecoration: "none", color: "#2563eb" }}
          >
            {groupId.replace(/-/g, " ")}
          </Link>
        </>
      )}

      {deviceId && (
        <>
          <span style={{ color: "#9ca3af" }}>/</span>
          <span style={{ fontWeight: 600 }}>{deviceId}</span>
        </>
      )}
    </div>
  )
}

function TopBar({ user = "Clinician", showOnlinePill = true }) {
  const navigate = useNavigate()

  function handleLogout() {
    // Clear any auth/session flags you use
    localStorage.removeItem("loggedIn")
    localStorage.removeItem("user")
    localStorage.removeItem("token") // safe even if you don't use it

    // Redirect to login
    navigate("/login", { replace: true })
  }

  return (
    <div
      className="topbar"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb",
        background: "white"
      }}
    >
      {/* Left: Breadcrumbs */}
      <Breadcrumbs />

      {/* Right: User / status */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* ONLINE pill is just a placeholder UI status */}
        {showOnlinePill && (
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              background: "#dcfce7",
              color: "#166534"
            }}
            title="UI placeholder status"
          >
            ONLINE
          </span>
        )}

        <div style={{ fontSize: 14, color: "#374151" }}>{user}</div>

        <button
          style={{
            border: "none",
            background: "transparent",
            color: "#ef4444",
            cursor: "pointer",
            fontWeight: 600
          }}
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default TopBar

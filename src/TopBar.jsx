function TopBar({ user,onLogout }) {
  return (
    <div className="topbar">
      <div className="topbar-title">
        Anesthesia Workstation
      </div>

      <div className="topbar-right">
        <span className="username">{user.name} ({user.role})</span>
        <span className="divider">|</span>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

export default TopBar

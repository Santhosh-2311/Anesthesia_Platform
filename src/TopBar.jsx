import { useNavigate } from "react-router-dom"

export default function TopBar() {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem("loggedIn")
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    navigate("/login", { replace: true })
  }

  return (
    <div className="topbar">
      <div className="brand">Thynkure Platform</div>
      <div className="topbarRight">
        <div className="userChip">Clinician</div>
        <button className="linkBtn danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}

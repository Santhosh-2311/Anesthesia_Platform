import { NavLink } from "react-router-dom"

export default function Sidebar() {
  const linkClass = ({ isActive }) =>
    `sidebar-item ${isActive ? "active" : ""}`

  return (
    <div className="sidebar">
      <NavLink to="/groups" className={linkClass}>
        Device Groups
      </NavLink>
    </div>
  )
}

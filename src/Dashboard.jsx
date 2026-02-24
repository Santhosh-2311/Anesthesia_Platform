import { Link } from "react-router-dom"

export default function Dashboard() {
  return (
    <div>
      <div className="pageTitle">Device Groups</div>

      <div className="grid3">
        <Link className="card clickable" to="/groups/anesthesia-workstation/devices" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="cardTitle">Anesthesia Workstations</div>
          <div className="muted">Active</div>
        </Link>

        <div className="card disabled">
          <div className="cardTitle">ICU Monitor</div>
          <div className="muted">Coming soon</div>
        </div>

        <div className="card disabled">
          <div className="cardTitle">Ventilator</div>
          <div className="muted">Coming soon</div>
        </div>
      </div>
    </div>
  )
}

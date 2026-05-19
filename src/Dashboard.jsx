import { Activity, AlertTriangle, Cpu, Wrench } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <div className="dashboard-title">
            Clinical Device Dashboard
          </div>

          <div className="dashboard-subtitle">
            Real-time overview of connected medical infrastructure
          </div>
        </div>
      </div>

      <div className="dashboard-stat-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon blue">
            <Cpu size={22} />
          </div>

          <div className="dashboard-stat-number">
            24
          </div>

          <div className="dashboard-stat-label">
            Total Devices
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon green">
            <Activity size={22} />
          </div>

          <div className="dashboard-stat-number">
            18
          </div>

          <div className="dashboard-stat-label">
            Active Devices
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon yellow">
            <Wrench size={22} />
          </div>

          <div className="dashboard-stat-number">
            3
          </div>

          <div className="dashboard-stat-label">
            Maintenance
          </div>
        </div>

        <div className="dashboard-stat-card">
          <div className="dashboard-stat-icon red">
            <AlertTriangle size={22} />
          </div>

          <div className="dashboard-stat-number">
            2
          </div>

          <div className="dashboard-stat-label">
            Active Alerts
          </div>
        </div>
      </div>
    </div>
  )
}
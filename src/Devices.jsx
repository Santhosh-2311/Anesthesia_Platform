import { Link, useParams } from "react-router-dom"

const TEMP_DEVICES_BY_GROUP = {
  "anesthesia-workstation": [
    { id: "AW-001", name: "OT-1 Workstation", location: "OT-1", status: "unknown" },
    { id: "AW-002", name: "OT-2 Workstation", location: "OT-2", status: "unknown" },
  ],
}

const GROUP_TITLES = {
  "anesthesia-workstation": "Anesthesia Workstation",
}

export default function Devices() {
  const { groupId } = useParams()
  const devices = TEMP_DEVICES_BY_GROUP[groupId] || []
  const title = GROUP_TITLES[groupId] || "Devices"

  // Save selection so Sidebar links work correctly (Live/Diagnostics)
  const rememberSelection = (deviceId) => {
    if (groupId) localStorage.setItem("selectedGroupId", groupId)
    if (deviceId) localStorage.setItem("selectedDeviceId", deviceId)
  }

  return (
    <div>
      {/* Old-style header: big title + back link */}
      <div className="pageHeaderRow">
        <h1 className="titleBig">{title}</h1>
        <Link className="backLink" to="/groups" onClick={() => rememberSelection(null)}>
          ← Back to groups
        </Link>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: "55%" }}>Name</th>
              <th style={{ width: "15%" }}>Location</th>
              <th style={{ width: "15%" }}>Status</th>
              <th style={{ width: "15%", textAlign: "right" }}>Action</th>
            </tr>
          </thead>

          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td className="strong">
                  {d.name} <span className="muted">({d.id})</span>
                </td>
                <td>{d.location}</td>
                <td className="muted">{d.status}</td>
                <td style={{ textAlign: "right" }}>
                  <Link
                    className="linkBtn"
                    to={`/groups/${groupId}/devices/${d.id}/live`}
                    onClick={() => rememberSelection(d.id)}
                  >
                    View Live
                  </Link>
                </td>
              </tr>
            ))}

            {!devices.length ? (
              <tr>
                <td colSpan="4" className="muted" style={{ padding: 14 }}>
                  No devices configured.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

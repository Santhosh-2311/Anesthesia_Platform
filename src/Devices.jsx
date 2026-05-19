import { Link, useParams } from "react-router-dom"
import workstationImg from "./assets/anesthesia-workstation.png"
import spirometerImg from "./assets/spirometer.png"

const DEVICE_GROUPS = {
  "anesthesia-workstation": {
    title: "Anesthesia Workstations",
    devices: [
      {
        id: "AW-1001",
        name: "Anesthesia Workstation 1",
        category: "ANESTHESIA WORKSTATIONS",
        location: "ICU - OR 1",
        calibration: "01-Apr-2026",
        status: "online",
        image: workstationImg,
      },
      {
        id: "AW-1002",
        name: "Anesthesia Workstation 2",
        category: "ANESTHESIA WORKSTATIONS",
        location: "ICU - OR 2",
        calibration: "01-Apr-2026",
        status: "online",
        image: workstationImg,
      },
      {
        id: "SP-2001",
        name: "Spirometer 1",
        category: "SPIROMETERS",
        location: "Pulmonary Lab 1",
        calibration: "01-Apr-2026",
        status: "online",
        image: spirometerImg,
      },
    ],
  },
}

export default function Devices() {
  const groupId = "anesthesia-workstation"

  const group = DEVICE_GROUPS[groupId]

  if (!group) {
    return <div className="page-empty">No devices found.</div>
  }

  const groupedDevices = group.devices.reduce((acc, device) => {
    if (!acc[device.category]) {
      acc[device.category] = []
    }

    acc[device.category].push(device)
    return acc
  }, {})

  function rememberSelection(deviceId) {
    localStorage.setItem("selectedGroupId", groupId)
    localStorage.setItem("selectedDeviceId", deviceId)
  }

  return (
    <div className="device-page">
      <div className="device-page-header">
        <div>
          <div className="device-page-title">Device List</div>
          <div className="device-page-subtitle">
            Select a device to view its details and real-time data
          </div>
        </div>

        <div className="device-toolbar">
          <input
            type="text"
            placeholder="Search devices..."
            className="device-search"
          />

          <button className="new-device-btn">+ New Tab</button>
        </div>
      </div>

      <div className="device-tabs">
        <button className="device-tab active">All Devices (24)</button>
        <button className="device-tab">Active (18)</button>
        <button className="device-tab">Maintenance (3)</button>
        <button className="device-tab">Offline (3)</button>
      </div>

      {Object.entries(groupedDevices).map(([category, devices]) => (
        <div key={category} className="device-section">
          <div className="device-section-header">
            <h2>{category}</h2>
            <button className="view-all-btn">View All →</button>
          </div>

          <div className="device-card-grid">
            {devices.map((device) => (
              <div className="device-card" key={device.id}>
                <div className="device-status online">
                  <span className="status-dot"></span>
                  Online
                </div>

                <div className="device-image-wrap">
                  <img
                    src={device.image}
                    alt={device.name}
                    className="device-image"
                  />
                </div>

                <div className="device-name">{device.name}</div>
                <div className="device-id">{device.id}</div>

                <div className="device-meta">
                  <div>Location: {device.location}</div>
                  <div>Last Calibration: {device.calibration}</div>
                </div>

                <Link
                  to={`/devices/${device.id}/live`}
                  className="select-device-btn"
                  onClick={() => rememberSelection(device.id)}
                >
                  Select
                </Link>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
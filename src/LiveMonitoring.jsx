import workstationImg from "./assets/anesthesia-workstation.png"
import {
  AlertTriangle,
  BatteryFull,
  UserCircle2,
  Wifi,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

function formatDate(tsMs) {
  if (!tsMs) return "--"

  return new Date(tsMs).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function formatTime(tsMs) {
  if (!tsMs) return "--"

  return new Date(tsMs).toLocaleTimeString("en-US", {
    hour12: false,
  })
}

function formatRuntime(ms) {
  if (!ms) return "--:--:--"

  const totalSec = Math.floor(ms / 1000)

  const h = String(Math.floor(totalSec / 3600)).padStart(2, "0")
  const m = String(Math.floor((totalSec % 3600) / 60)).padStart(2, "0")
  const s = String(totalSec % 60).padStart(2, "0")

  return `${h}:${m}:${s}`
}

export default function LiveMonitoring({
  latest,
  telemetry,
  status,
  lastUpdateMs,
}) {

  const isOnline = status?.isLive

  const formattedDate =
    formatDate(latest?.tsMs)

  const formattedTime =
    formatTime(latest?.tsMs)

  const runtime =
    formatRuntime(latest?.uptimeMs)

  console.log("THIS IS THE ACTIVE COMPONENT")

  console.log("LIVE MONITORING latest:", latest)

  console.log("LIVE MONITORING telemetry:", telemetry)

  console.log("LIVE MONITORING status:", status)

  const navigate = useNavigate()

  return (
    <div className="live-monitor-page">

      {/* ================================================= */}
      {/* TOP ACTION BAR */}
      {/* ================================================= */}

      <div className="workspace-topbar">

        {/* LEFT */}
        <div className="workspace-topbar-left">

          <button
            className="back-device-btn"
            onClick={() => navigate("/devices")}
          >
            ← Device List
          </button>

          <div className="device-chip">

            <img
              src={workstationImg}
              alt="device"
            />

            <div>
              <div className="chip-device-id">
                {latest?.deviceId || "AW-1001"}
              </div>

              <div className="chip-device-name">
                Anesthesia Workstation
              </div>
            </div>

            <span className="chip-close">
              ×
            </span>

          </div>

        </div>

        {/* RIGHT */}
        <div className="workspace-topbar-right">

          <button className="device-settings-btn">
            Device Settings
          </button>

        <button className="new-tab-btn">
           + New Tab
        </button>

        </div>

      </div>

      {/* ================================================= */}
{/* MAIN DEVICE PANEL */}
{/* ================================================= */}

<div className="device-live-header">

  {/* MAIN HEADER */}
  <div className="device-header-main">

    {/* LEFT SIDE */}
    <div className="device-header-left">

      <img
        src={workstationImg}
        alt="Anesthesia Workstation"
        className="device-main-image"
      />

      {/* NEW COMPACT HEADER CONTENT */}
      <div className="device-header-content">

        {/* TITLE BLOCK */}
        <div className="device-title-block">

          <div className="device-title-row">

            <h1 className="device-main-title">
              {latest?.deviceId || "AW-1001"}
            </h1>

            <div className="device-online-badge">
              {status?.isLive ? "Online" : "Offline"}
            </div>

          </div>

          <div className="device-subtitle">

            <span>
              Anesthesia Workstation
            </span>

            <span>
              ICU - OR 1
            </span>

          </div>

        </div>

        {/* META GRID */}
        <div className="device-meta-grid">

          {/* LOCATION */}
          <div className="device-meta-item">

            <div className="meta-label">
              Location
            </div>

            <div className="meta-value">
              ICU - OR 1
            </div>

          </div>

          {/* LAST CALIBRATION */}
          <div className="device-meta-item">

            <div className="meta-label">
              Last Calibration
            </div>

            <div className="meta-value">
              {lastUpdateMs
                ? new Date(lastUpdateMs).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "--"}
            </div>

          </div>

          {/* NEXT MAINTENANCE */}
          <div className="device-meta-item">

            <div className="meta-label">
              Next Maintenance
            </div>

            <div className="meta-value">
              Scheduled
            </div>

          </div>

          {/* SERIAL NUMBER */}
          <div className="device-meta-item">

            <div className="meta-label">
              Serial No.
            </div>

            <div className="meta-value">
              AW1001-26-0001
            </div>

          </div>

          {/* SOFTWARE VERSION */}
          <div className="device-meta-item">

            <div className="meta-label">
              Software Version
            </div>

            <div className="meta-value">
              v2.4.1
            </div>

          </div>

        </div>

      </div>
    </div>
  </div>
        {/* TABS */}
        <div className="device-tabs-live">

          <button className="live-tab active">
            Overview
          </button>

          <button className="live-tab">
            Ventilator
          </button>

          <button className="live-tab">
            Rotometer (Gas)
          </button>

          <button className="live-tab">
            Alarms
          </button>

          <button className="live-tab">
            Events Log
          </button>

          <button className="live-tab">
            Settings
          </button>

        </div>
      </div>

      {/* ================================================= */}
      {/* OVERVIEW STRIP */}
      {/* ================================================= */}

      <div className="overview-strip">

        <div className="strip-card">
          <div className="strip-title">
            Device Status
          </div>

          <div className="strip-value green">
            {status?.isLive
              ? "● Online"
              : "● Offline"}
          </div>
        </div>

        <div className="strip-card">
          <div className="strip-title">
            Ventilator Mode
          </div>

          <div className="strip-value">
            {latest?.mode ?? "--"}
          </div>
        </div>

        <div className="strip-card">
          <div className="strip-title">
            Tidal Volume
          </div>

          <div className="strip-value green">
            {latest?.vtSet ?? "--"} <span>mL</span>
          </div>
        </div>

        <div className="strip-card">
          <div className="strip-title">
            Rate
          </div>

          <div className="strip-value blue">
            {latest?.rrSet ?? "--"} <span>bpm</span>
          </div>
        </div>

        <div className="strip-card">
          <div className="strip-title">
            PEEP
          </div>

          <div className="strip-value green">
            {latest?.peep ?? "--"} <span>cmH₂O</span>
          </div>
        </div>

        <div className="strip-card">
          <div className="strip-title">
            I:E Ratio
          </div>

          <div className="strip-value purple">
            {latest?.ieSet ?? "--"}
          </div>
        </div>

        <div className="overview-card gas-inline-card">

          <div className="gas-left">

            <div className="overview-label">
              O₂ Supply
            </div>

            <div className="overview-value green">
              {latest?.o2_kpa ?? "--"} <span>kPa</span>
            </div>

          </div>

          <button className="inline-details-btn">
            View Details
          </button>

        </div>

      </div>

      {/* ================================================= */}
      {/* LOWER PANELS */}
      {/* ================================================= */}

      <div className="monitor-panels">

        {/* WAVEFORMS */}
        <div className="panel waveform-panel">

          <h3>Waveforms</h3>

          <div className="wave-chart">
            <div className="wave-label">
              Pressure (cmH₂O)
            </div>

            <div className="wave-placeholder green-wave"></div>

            <div className="wave-live-value">
              PIP: {latest?.pip ?? "--"} cmH₂O
            </div>
          </div>

          <div className="wave-chart">
            <div className="wave-label">
              Flow (L/min)
            </div>

            <div className="wave-placeholder purple-wave"></div>

            <div className="wave-live-value">
              Flow: {latest?.totalFlow ?? "--"} L/min
            </div>
          </div>

          <div className="wave-chart">
            <div className="wave-label">
              ETCO₂ (mmHg)
            </div>

            <div className="wave-placeholder yellow-wave"></div>

            <div className="wave-live-value">
              ETCO₂: --
            </div>
          </div>

        </div>

        {/* KEY PARAMETERS */}
        <div className="panel key-panel">

          <h3>Key Parameters</h3>

          <div className="key-grid">

            <div className="key-item">
              <span>Ppeak</span>
              <strong>
                {latest?.pip ?? "--"}
              </strong>
            </div>

            <div className="key-item">
              <span>Pmean</span>
              <strong>
                {latest?.peep ?? "--"}
              </strong>
            </div>

            <div className="key-item">
              <span>MV</span>
              <strong>
                {latest?.totalFlow ?? "--"}
              </strong>
            </div>

            <div className="key-item">
              <span>VTe</span>
              <strong>
                {latest?.vtMeasured ?? "--"}
              </strong>
            </div>

            <div className="key-item">
              <span>VTi</span>
              <strong>
                {latest?.vtSet ?? "--"}
              </strong>
            </div>

            <div className="key-item">
              <span>FiO₂</span>
              <strong>
                {latest?.fio2 ?? "--"}
              </strong>
            </div>

            <div className="key-item">
              <span>ETCO₂</span>
              <strong>
                --
              </strong>
            </div>

            <div className="key-item">
              <span>Total Flow</span>
              <strong>
                {latest?.totalFlow ?? "--"}
              </strong>
            </div>

            <div className="key-item">
              <span>Rate</span>
              <strong>
                {latest?.rrSet ?? "--"}
              </strong>
            </div>

          </div>
        </div>

        {/* GAS PANEL */}
        <div className="panel gas-panel">

          <h3>Gas (Rotameter)</h3>

          <div className="gas-grid">

            <div className="gas-column">

              <div className="gas-name green">
                O₂
              </div>

              <div className="gas-bar-wrap">
                <div
                  className="gas-bar green-bar"
                  style={{
                    height: `${Math.min(latest?.fio2 || 0, 100)}%`
                  }}
                ></div>
              </div>

              <div className="gas-reading">
                {latest?.fio2 ?? "--"}
              </div>
            </div>

            <div className="gas-column">

              <div className="gas-name blue">
                N₂O
              </div>

              <div className="gas-bar-wrap">
                <div
                  className="gas-bar blue-bar"
                  style={{
                    height: `${Math.min(latest?.n2o || 0, 100)}%`
                  }}
                ></div>
              </div>

              <div className="gas-reading">
                {latest?.n2o ?? "--"}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
import workstationImg from "./assets/anesthesia-workstation.png"
import {
  AlertTriangle,
  BatteryFull,
  UserCircle2,
  Wifi,
} from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import WaveformCanvas
from "./components/waveforms/WaveformCanvas"

import {
  pressureBuffer,
  flowBuffer,
  etco2Buffer
}
from "./components/waveformStore"

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

  const navigate = useNavigate()

  // Gas Panel //

const [secondaryGas, setSecondaryGas] =
  useState("n2o")

const MAX_FLOW = 10
const MIN_FLOW = 0

const o2Flow =
  latest?.o2Flow ?? 0

const o2SetFlow =
  latest?.o2SetFlow ?? 0

const n2oSetFlow =
  latest?.n2oSetFlow ?? 0

const airSetFlow =
  latest?.airSetFlow ?? 0

const secondaryFlow =
  secondaryGas === "n2o"
    ? latest?.n2oFlow ?? 0
    : latest?.airFlow ?? 0
    const secondarySetFlow =
  secondaryGas === "n2o"
    ? latest?.n2oSetFlow ?? 0
    : latest?.airSetFlow ?? 0

function flowToPercent(flow) {

  const clamped =
    Math.max(
      MIN_FLOW,
      Math.min(flow, MAX_FLOW)
    )

  return (
    (clamped - MIN_FLOW) /
    (MAX_FLOW - MIN_FLOW)
  ) * 100
}

const o2Height =
  flowToPercent(o2Flow)

const secondaryHeight =
  flowToPercent(secondaryFlow)

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

           <span
              className="chip-close"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()

                localStorage.removeItem("selectedDeviceId")
                localStorage.removeItem("selectedGroupId")

                navigate("/devices")
              }}
            >
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

          <div
              className={`device-status-badge ${
                isOnline ? "online" : "offline"
              }`}
            >
              {isOnline ? "Online" : "Offline"}
            </div>

          </div>

          <div className="device-subtitle">

            <span>
              Anesthesia Workstation
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
{/* MAIN OVERVIEW LAYOUT                              */}
{/* ================================================= */}

<div className="overview-main-layout">

  {/* ================================================= */}
  {/* LEFT VERTICAL STRIP                              */}
  {/* ================================================= */}

  <div className="overview-left-strip">

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

    <div className="strip-card gas-inline-card">

      <div className="gas-left">

        <div className="metric-label">
  O₂ Supply
</div>

<div className="metric-value green">
  {latest?.o2Psi ?? "--"} <span>psi</span>
</div>

      </div>

      <button className="inline-details-btn">
        View Details
      </button>

    </div>

  </div>

{/* ================================================= */}
{/* WAVEFORM PANEL                                   */}
{/* ================================================= */}

<div className="panel waveform-panel">

  <h3>Waveforms</h3>

  {/* ============================================= */}
  {/* PRESSURE WAVEFORM                            */}
  {/* ============================================= */}

  <div className="wave-chart">

    <div className="wave-label">
      Pressure (cmH₂O)
    </div>

    <WaveformCanvas
      buffer={pressureBuffer}
      color="#4dff88"
      min={0}
      max={40}
    />

    <div className="wave-live-value">
  Pressure: {
    pressureBuffer.samples.length
      ? pressureBuffer.samples[
          pressureBuffer.samples.length - 1
        ].toFixed(1)
      : "--"
  } cmH₂O
</div>

  </div>

  {/* ============================================= */}
  {/* Volume WAVEFORM                                */}
  {/* ============================================= */}

  <div className="wave-chart">

    <div className="wave-label">
  Volume (mL)
</div>

   <WaveformCanvas
  buffer={flowBuffer}
  color="#b388ff"
  min={0}
  max={600}
/>

   <div className="wave-live-value">
  Volume: {
    flowBuffer.samples.length
      ? flowBuffer.samples[
          flowBuffer.samples.length - 1
        ].toFixed(0)
      : "--"
  } mL
</div>

  </div>

  {/* ============================================= */}
  {/* ETCO2 WAVEFORM                               */}
  {/* ============================================= */}

  <div className="wave-chart">

    <div className="wave-label">
      ETCO₂ (mmHg)
    </div>

    <WaveformCanvas
      buffer={etco2Buffer}
      color="#ffd54f"
      min={0}
      max={50}
    />

    <div className="wave-live-value">
      ETCO₂: {latest?.etco2?.toFixed(1) ?? "--"} mmHg
    </div>

  </div>

</div>
  {/* ================================================= */}
{/* GAS PANEL                                        */}
{/* ================================================= */}

<div className="panel gas-panel">

  <h3>Gas (Rotameter)</h3>

  <div className="gas-section">

    {/* OXYGEN */}

    <div className="gas-column">

      <div className="gas-name o2">
        O₂
      </div>

      <div className="tube-wrapper">

        <div className="tube-scale">
          {[10,9,8,7,6,5,4,3,2,1,0].map(v => (
            <div
              key={v}
              className="scale-mark"
            >
              <span>{v}</span>
              <div className="tick" />
            </div>
          ))}
        </div>

        <div className="tube">

          <div
            className="tube-fill o2-fill"
            style={{
              height: `${o2Height}%`
            }}
          />

        </div>

      </div>

      <div className="tube-value">
  {o2SetFlow.toFixed(2)}
  <span>LPM</span>
</div>

    </div>

    {/* SECONDARY GAS */}

    <div className="gas-column">

      <div
        className={`gas-name ${
          secondaryGas === "n2o"
            ? "n2o"
            : "air"
        }`}
      >
        {secondaryGas === "n2o"
          ? "N₂O"
          : "AIR"}
      </div>

      <div className="tube-wrapper">

        <div className="tube-scale">
          {[10,9,8,7,6,5,4,3,2,1,0].map(v => (
            <div
              key={v}
              className="scale-mark"
            >
              <span>{v}</span>
              <div className="tick" />
            </div>
          ))}
        </div>

        <div className="tube">

          <div
            className={`tube-fill ${
              secondaryGas === "n2o"
                ? "n2o-fill"
                : "air-fill"
            }`}
            style={{
              height: `${secondaryHeight}%`
            }}
          />

        </div>

      </div>

      <div className="tube-value">
  {secondarySetFlow.toFixed(2)}
  <span>LPM</span>
</div>

    </div>

  </div>

  {/* GAS SELECTOR */}

  <div className="gas-toggle">

    <button
      className={
        secondaryGas === "n2o"
          ? "active"
          : ""
      }
      onClick={() =>
        setSecondaryGas("n2o")
      }
    >
      N₂O
    </button>

    <button
      className={
        secondaryGas === "air"
          ? "active"
          : ""
      }
      onClick={() =>
        setSecondaryGas("air")
      }
    >
      AIR
    </button>

  </div>

</div>

  {/* ================================================= */}
  {/* KEY PARAMETERS                                   */}
  {/* ================================================= */}

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
          {latest?.etco2?.toFixed(1) ?? "--"}
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
</div>
</div>
  )
}
// src/hooks/useLiveTelemetry.js
import { useEffect, useMemo, useState } from "react"
import { fetchLatestTelemetry } from "../api/telemetry"
import { adaptLatestTelemetry } from "../telemetryAdapter"

// Global in-memory store used to maintain telemetry state separately for each device
const deviceStores = new Map()

function getStore(deviceBackendId) {
  if (!deviceStores.has(deviceBackendId)) {

    // Store contains latest telemetry, rolling telemetry history,
    // connection status, listeners, and polling timer
    deviceStores.set(deviceBackendId, {
      data: [],
      latest: null,

      status: "idle", // "idle" | "online" | "offline"
      lastUpdateMs: 0, // time we last received NEW telemetry (ts changed)
      lastTelemTsMs: 0, // last telemetry tsMs we accepted

      listeners: new Set(),
      timer: null,
    })
  }
  return deviceStores.get(deviceBackendId)
}

// Notify all subscribed UI components whenever telemetry updates
function notify(store) {
  for (const fn of store.listeners) fn()
}

// Safe fetch supports multiple backend request formats
async function safeFetchLatest(deviceBackendId) {
  try {
    return await fetchLatestTelemetry(deviceBackendId)
  } catch {
    return await fetchLatestTelemetry({ deviceId: deviceBackendId })
  }
}

// Main polling function responsible for fetching and processing live telemetry
async function pollOnce(deviceBackendId, bufferSize) {
  const store = getStore(deviceBackendId)

  try {
    const raw = await safeFetchLatest(deviceBackendId)

    // Normalize backend telemetry into frontend-compatible structure
    const p = adaptLatestTelemetry(raw)

    // If backend returned no telemetry, mark device offline
    if (!p) {
      store.status = "offline"
      notify(store)
      return
    }

    const tsMs = p.tsMs || 0

    // Used to detect whether telemetry sample is actually new
    const isNew = tsMs && tsMs !== store.lastTelemTsMs

    // If telemetry timestamp did not advance,
    // device may still be connected but not sending fresh samples
    if (!isNew) {
      const age = Date.now() - (store.lastUpdateMs || 0)

      // Mark offline if no fresh telemetry received within 5 seconds
      if (age > 5000) store.status = "offline"

      notify(store)
      return
    }

    // Save latest telemetry metadata
    store.lastTelemTsMs = tsMs
    store.latest = p
    store.status = "online"
    store.lastUpdateMs = Date.now()

    // Add latest telemetry into rolling buffer used for live graphs
    store.data.push(p)

    // Keep only latest N telemetry samples to avoid memory growth
    if (store.data.length > bufferSize) {
      store.data.splice(0, store.data.length - bufferSize)
    }

    notify(store)
  } catch (e) {
    console.error("pollOnce error:", e)

    // Any polling failure marks device offline
    store.status = "offline"
    notify(store)
  }
}

// Starts continuous telemetry polling using setInterval
function startPolling(deviceBackendId, pollMs, bufferSize) {
  const store = getStore(deviceBackendId)
  if (store.timer) return

  pollOnce(deviceBackendId, bufferSize)

  // Poll backend every pollMs milliseconds
  store.timer = window.setInterval(() => pollOnce(deviceBackendId, bufferSize), pollMs)
}

// Stops polling when no UI components are subscribed
function stopPolling(deviceBackendId) {
  const store = getStore(deviceBackendId)
  if (store.timer) {
    window.clearInterval(store.timer)
    store.timer = null
  }
}

export function useLiveTelemetry(deviceBackendId, { pollMs = 1000, bufferSize = 120 } = {}) {

  // Dummy state used to trigger React re-renders whenever telemetry updates
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!deviceBackendId) return

    const store = getStore(deviceBackendId)

    // Listener updates tick state, causing UI refresh
    const onChange = () => setTick((x) => x + 1)

    store.listeners.add(onChange)

    // Begin live telemetry polling
    startPolling(deviceBackendId, pollMs, bufferSize)

    // Cleanup removes listener and stops polling if unused
    return () => {
      store.listeners.delete(onChange)
      if (store.listeners.size === 0) stopPolling(deviceBackendId)
    }
  }, [deviceBackendId, pollMs, bufferSize])

  // Memoized telemetry object prevents unnecessary recalculations
  return useMemo(() => {
    if (!deviceBackendId) {
      return { data: [], latest: null, status: { tag: "OFFLINE", isLive: false }, lastUpdateMs: 0 }
    }

    const store = getStore(deviceBackendId)

    // Device considered LIVE only if fresh telemetry arrived recently
    const isLive =
      store.status === "online" && Date.now() - (store.lastUpdateMs || 0) <= 5000

    return {

      // New array/object references ensure React charts re-render properly
      data: [...store.data],
      latest: store.latest ? { ...store.latest } : null,

      status: { tag: isLive ? "LIVE" : "OFFLINE", isLive },

      lastUpdateMs: store.lastUpdateMs,
    }
  }, [deviceBackendId, tick])
}
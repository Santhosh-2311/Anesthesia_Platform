// src/hooks/useLiveTelemetry.js
import { useEffect, useMemo, useState } from "react"
import { fetchLatestTelemetry } from "../api/telemetry"
import { adaptLatestTelemetry } from "../telemetryAdapter"

const deviceStores = new Map()

function getStore(deviceBackendId) {
  if (!deviceStores.has(deviceBackendId)) {
    deviceStores.set(deviceBackendId, {
      data: [],
      latest: null,

      status: "idle", // "idle" | "online" | "offline"
      lastUpdateMs: 0, // ✅ time we last received NEW telemetry (ts changed)
      lastTelemTsMs: 0, // ✅ last telemetry tsMs we accepted

      listeners: new Set(),
      timer: null,
    })
  }
  return deviceStores.get(deviceBackendId)
}

function notify(store) {
  for (const fn of store.listeners) fn()
}

async function safeFetchLatest(deviceBackendId) {
  try {
    return await fetchLatestTelemetry(deviceBackendId)
  } catch {
    return await fetchLatestTelemetry({ deviceId: deviceBackendId })
  }
}

async function pollOnce(deviceBackendId, bufferSize) {
  const store = getStore(deviceBackendId)

  try {
    const raw = await safeFetchLatest(deviceBackendId)
    const p = adaptLatestTelemetry(raw)

    // Backend says no data
    if (!p) {
      store.status = "offline"
      notify(store)
      return
    }

    const tsMs = p.tsMs || 0
    const isNew = tsMs && tsMs !== store.lastTelemTsMs

    // ✅ If telemetry didn't advance, treat as "no new sample"
    if (!isNew) {
      const age = Date.now() - (store.lastUpdateMs || 0)
      if (age > 5000) store.status = "offline"
      notify(store)
      return
    }

    // ✅ New telemetry sample
    store.lastTelemTsMs = tsMs
    store.latest = p
    store.status = "online"
    store.lastUpdateMs = Date.now()

    store.data.push(p)

    // keep last N
    if (store.data.length > bufferSize) {
      store.data.splice(0, store.data.length - bufferSize)
    }

    notify(store)
  } catch (e) {
    console.error("pollOnce error:", e)
    store.status = "offline"
    notify(store)
  }
}

function startPolling(deviceBackendId, pollMs, bufferSize) {
  const store = getStore(deviceBackendId)
  if (store.timer) return

  pollOnce(deviceBackendId, bufferSize)
  store.timer = window.setInterval(() => pollOnce(deviceBackendId, bufferSize), pollMs)
}

function stopPolling(deviceBackendId) {
  const store = getStore(deviceBackendId)
  if (store.timer) {
    window.clearInterval(store.timer)
    store.timer = null
  }
}

export function useLiveTelemetry(deviceBackendId, { pollMs = 1000, bufferSize = 120 } = {}) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!deviceBackendId) return

    const store = getStore(deviceBackendId)
    const onChange = () => setTick((x) => x + 1)

    store.listeners.add(onChange)
    startPolling(deviceBackendId, pollMs, bufferSize)

    return () => {
      store.listeners.delete(onChange)
      if (store.listeners.size === 0) stopPolling(deviceBackendId)
    }
  }, [deviceBackendId, pollMs, bufferSize])

  return useMemo(() => {
    if (!deviceBackendId) {
      return { data: [], latest: null, status: { tag: "OFFLINE", isLive: false }, lastUpdateMs: 0 }
    }

    const store = getStore(deviceBackendId)

    // ✅ LIVE only if we got NEW telemetry recently
    const isLive =
      store.status === "online" && Date.now() - (store.lastUpdateMs || 0) <= 5000

    return {
      // return new references so charts update
      data: [...store.data],
      latest: store.latest ? { ...store.latest } : null,
      status: { tag: isLive ? "LIVE" : "OFFLINE", isLive },
      lastUpdateMs: store.lastUpdateMs,
    }
  }, [deviceBackendId, tick])
}
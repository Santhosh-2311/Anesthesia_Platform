// src/hooks/useLiveTelemetry.js

import { useEffect, useMemo, useState } from "react"

import { fetchLatestTelemetry } from "../api/telemetry"

import {
  adaptLatestTelemetry,
  adaptTelemetry,
} from "../telemetryAdapter"

import {
  connectWebSocket,
  disconnectWebSocket
}
from "../services/wsClient"

// ----------------------------------------------------
// GLOBAL DEVICE STORES
// ----------------------------------------------------

const deviceStores = new Map()

function getStore(deviceBackendId) {
  if (!deviceStores.has(deviceBackendId)) {
    deviceStores.set(deviceBackendId, {
      data: [],
      latest: null,

      status: "idle", // idle | online | offline

      lastUpdateMs: 0,
      lastTelemTsMs: 0,

      listeners: new Set(),

      timer: null,
    })
  }

  return deviceStores.get(deviceBackendId)
}

// ----------------------------------------------------
// NOTIFY REACT LISTENERS
// ----------------------------------------------------

function notify(store) {
  for (const fn of store.listeners) {
    fn()
  }
}

// ----------------------------------------------------
// SAFE BACKEND FETCH
// ----------------------------------------------------

async function safeFetchLatest(deviceBackendId) {
  try {
    return await fetchLatestTelemetry(deviceBackendId)
  } catch {
    return await fetchLatestTelemetry({
      deviceId: deviceBackendId,
    })
  }
}

// ----------------------------------------------------
// INITIAL REST SNAPSHOT FETCH
// ----------------------------------------------------

async function pollOnce(deviceBackendId, bufferSize) {
  const store = getStore(deviceBackendId)

  try {
    const raw = await safeFetchLatest(deviceBackendId)

    const p = adaptLatestTelemetry(raw)

    if (!p) {
      store.status = "offline"

      notify(store)

      return
    }

    const tsMs = p.tsMs || 0

    const isNew =
      tsMs &&
      tsMs !== store.lastTelemTsMs

    if (!isNew) {
      const age =
        Date.now() -
        (store.lastUpdateMs || 0)

      if (age > 5000) {
        store.status = "offline"
      }

      notify(store)

      return
    }

    store.lastTelemTsMs = tsMs

    store.latest = p

    store.status = "online"

    store.lastUpdateMs = Date.now()

    if (!store.data) {
      store.data = []
    }

    store.data.push(p)

    if (store.data.length > bufferSize) {
      store.data.splice(
        0,
        store.data.length - bufferSize
      )
    }

    notify(store)
  } catch (e) {
    console.error("pollOnce error:", e)

    store.status = "offline"

    notify(store)
  }
}

// ----------------------------------------------------
// INITIAL SNAPSHOT ONLY
// ----------------------------------------------------

function startPolling(
  deviceBackendId,
  pollMs,
  bufferSize
) {
  pollOnce(deviceBackendId, bufferSize)
}

// ----------------------------------------------------
// CLEANUP
// ----------------------------------------------------

function stopPolling(deviceBackendId) {
  const store = getStore(deviceBackendId)

  if (store.timer) {
    window.clearInterval(store.timer)

    store.timer = null
  }
}

// ----------------------------------------------------
// MAIN HOOK
// ----------------------------------------------------

export function useLiveTelemetry(
  deviceBackendId,
  {
    pollMs = 1000,
    bufferSize = 120,
  } = {}
) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!deviceBackendId) return

    const store =
      getStore(deviceBackendId)

    // ------------------------------------------
    // REACT UPDATE LISTENER
    // ------------------------------------------

    const onChange = () => {
      setTick((x) => x + 1)
    }

    store.listeners.add(onChange)

    // ------------------------------------------
    // INITIAL REST FETCH
    // ------------------------------------------

    startPolling(
      deviceBackendId,
      pollMs,
      bufferSize
    )

    // ------------------------------------------
    // MQTT LIVE STREAM
    // ------------------------------------------

    connectWebSocket((incomingData) => {
      try {

        console.log(
          "MQTT LIVE DATA:",
          incomingData
        )

        const normalized =
          adaptLatestTelemetry(
            incomingData
          )

        if (!normalized) return

        // --------------------------------------
        // IMPORTANT:
        // CREATE NEW REFERENCES
        // --------------------------------------

        store.latest = {
          ...normalized,
        }

        store.data = [
          ...store.data,
          {
            ...normalized,
          },
        ]

        // --------------------------------------
        // MAINTAIN BUFFER SIZE
        // --------------------------------------

        if (
          store.data.length >
          bufferSize
        ) {
          store.data =
            store.data.slice(
              -bufferSize
            )
        }

        // --------------------------------------
        // UPDATE STATUS
        // --------------------------------------

        store.status = "online"

        store.lastUpdateMs =
          Date.now()

        // --------------------------------------
        // FORCE UI RE-RENDER
        // --------------------------------------

        notify(store)

      } catch (err) {

        console.error(
          "MQTT telemetry handling error:",
          err
        )
      }
    })

    // ------------------------------------------
    // CLEANUP
    // ------------------------------------------

    return () => {

      store.listeners.delete(
        onChange
      )

      if (
        store.listeners.size === 0
      ) {
        stopPolling(
          deviceBackendId
        )

        disconnectWebSocket()
      }
    }

  }, [deviceBackendId])

  // ------------------------------------------------
  // MEMOIZED REACT STATE
  // ------------------------------------------------

  return useMemo(() => {

    if (!deviceBackendId) {

      return {
        data: [],
        latest: null,

        status: {
          tag: "OFFLINE",
          isLive: false,
        },

        lastUpdateMs: 0,
      }
    }

    const store =
      getStore(deviceBackendId)

    // ------------------------------------------
    // DEVICE LIVE STATUS
    // ------------------------------------------

    const isLive =
      store.status === "online" &&
      Date.now() -
        store.lastUpdateMs <=
        5000

    return {

      // IMPORTANT:
      // RETURN NEW REFERENCES

      data: [
        ...store.data,
      ],

      latest:
        store.latest
          ? {
              ...store.latest,
            }
          : null,

      status: {
        tag: isLive
          ? "LIVE"
          : "OFFLINE",

        isLive,
      },

      lastUpdateMs:
        store.lastUpdateMs,
    }

  }, [deviceBackendId, tick])
}
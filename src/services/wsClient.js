let socket = null

export function connectWebSocket(onMessage) {

  // Return existing live socket
  if (
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    return socket
  }

  // Return connecting socket — don't create duplicate
  if (
    socket &&
    socket.readyState === WebSocket.CONNECTING
  ) {
    return socket
  }

  const wsUrl =
    import.meta.env.VITE_WS_URL

  console.log("Creating new WebSocket")

  socket = new WebSocket(wsUrl)

  socket.onopen = () => {
    console.log(
      "WebSocket connected",
      new Date().toLocaleTimeString()
    )
  }

  socket.onmessage = (event) => {

    console.log("RAW WS EVENT:", event.data)

    try {

      const parsed =
        JSON.parse(event.data)

      console.log("PARSED WS:", parsed)
      console.log("WS TYPE:", parsed.type)

      if (parsed.type === "telemetry") {

        // ---------------------------------
        // PING FILTER
        // ---------------------------------

        if (
          parsed?.data?.ventilator?.mode === "PING"
        ) {
          console.log("WS PING packet blocked")
          return
        }

        console.log("TELEMETRY FORWARDED")

        onMessage(parsed.data)
      }

    } catch (err) {
      console.error("WS parse error:", err)
    }
  }

  socket.onclose = (event) => {
    console.log(
      "WebSocket closed — code:",
      event.code
    )

    socket = null

    // Always reconnect on unexpected close
    if (event.code !== 1000) {
      setTimeout(() => {
        connectWebSocket(onMessage)
      }, 3000)
    }
  }

  socket.onerror = (err) => {
    console.error("WebSocket error:", err)
  }

  return socket
}

export function disconnectWebSocket() {

  // Only call this on full app unmount
  // NOT on component cleanup

  if (!socket) return

  if (
    socket.readyState === WebSocket.CONNECTING
  ) {
    socket.onopen = () => {
      socket.close(1000, "app unmount")
      socket = null
    }
    return
  }

  socket.close(1000, "app unmount")
  socket = null
}
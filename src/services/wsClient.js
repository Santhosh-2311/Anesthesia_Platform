let socket = null

export function connectWebSocket(onMessage) {

  if (socket) {
    return socket
  }

  const wsUrl =
    import.meta.env.VITE_WS_URL

  socket = new WebSocket(wsUrl)

  socket.onopen = () => {

    console.log(
      "WebSocket connected"
    )
  }

  socket.onmessage = (event) => {

    try {

      const parsed =
        JSON.parse(event.data)

      console.log(
        "WS MESSAGE:",
        parsed
      )

      if (
        parsed.type === "telemetry"
      ) {

        onMessage(parsed.data)
      }

    } catch (err) {

      console.error(
        "WS parse error:",
        err
      )
    }
  }

  socket.onclose = () => {

    console.log(
      "WebSocket disconnected"
    )

    socket = null

    // auto reconnect
    setTimeout(() => {

      connectWebSocket(onMessage)

    }, 3000)
  }

  socket.onerror = (err) => {

    console.error(
      "WebSocket error:",
      err
    )
  }

  return socket
}

export function disconnectWebSocket() {

  if (socket) {

    socket.close()

    socket = null
  }
}
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
    console.log(
  "WS RECEIVED",
  new Date().toLocaleTimeString()
)
  }

socket.onmessage = (event) => {

  console.log(
    "RAW WS EVENT:",
    event.data
  )

  try {

    const parsed =
      JSON.parse(event.data)

    console.log(
      "PARSED WS:",
      parsed
    )

    console.log(
      "WS TYPE:",
      parsed.type
    )

    if (
      parsed.type === "telemetry"
    ) {

      console.log(
        "TELEMETRY FORWARDED"
      )

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
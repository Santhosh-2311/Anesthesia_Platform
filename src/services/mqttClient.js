import mqtt from "mqtt"

let client = null

export async function connectMQTT(onMessage) {

  try {

    // Prevent duplicate connections
    if (client && client.connected) {

      console.log("MQTT already connected")

      return client
    }

    // ------------------------------------------------
    // ENV VARIABLES
    // ------------------------------------------------

    const endpoint =
      import.meta.env.VITE_IOT_ENDPOINT

    const topic =
      import.meta.env.VITE_IOT_TOPIC

    // ------------------------------------------------
    // VALIDATION
    // ------------------------------------------------

    if (!endpoint) {

      console.error(
        "Missing VITE_IOT_ENDPOINT"
      )

      return
    }

    if (!topic) {

      console.error(
        "Missing VITE_IOT_TOPIC"
      )

      return
    }

    console.log(
      "MQTT ENDPOINT:",
      endpoint
    )

    console.log(
      "MQTT TOPIC:",
      topic
    )

    // ------------------------------------------------
    // CREATE MQTT CLIENT
    // ------------------------------------------------

    client = mqtt.connect(
      `wss://${endpoint}/mqtt`,
      {

        protocol: "wss",

        clean: true,

        reconnectPeriod: 3000,

        connectTimeout: 10000,

        clientId:
          "web_" +
          Math.random()
            .toString(16)
            .slice(2),
      }
    )

    // ------------------------------------------------
    // CONNECTED
    // ------------------------------------------------

    client.on(
      "connect",
      () => {

        console.log(
          "MQTT CONNECTED"
        )

        client.subscribe(
          topic,
          (err) => {

            if (err) {

              console.error(
                "MQTT SUBSCRIBE ERROR:",
                err
              )

            } else {

              console.log(
                "MQTT SUBSCRIBED:",
                topic
              )
            console.log("SUBSCRIBE SUCCESS")  
            }
          }
        )
      }
    )

    // ------------------------------------------------
    // MESSAGE RECEIVED
    // ------------------------------------------------

    client.on(
      "message",
      (receivedTopic, payload) => {
        console.log("MESSAGE EVENT FIRED")

        try {

          const text =
            payload.toString()

          console.log(
            "MQTT RAW:",
            text
          )

          const parsed =
            JSON.parse(text)

          console.log(
            "MQTT PARSED:",
            parsed
          )

          // Push live telemetry to React
          onMessage(parsed)

        } catch (err) {

          console.error(
            "MQTT PARSE ERROR:",
            err
          )
        }
      }
    )

    // ------------------------------------------------
    // ERROR HANDLING
    // ------------------------------------------------

    client.on(
      "error",
      (err) => {

        console.error(
          "MQTT ERROR:",
          err
        )
      }
    )

    client.on(
      "close",
      () => {

        console.log(
          "MQTT CLOSED"
        )
      }
    )

    client.on(
      "offline",
      () => {

        console.log(
          "MQTT OFFLINE"
        )
      }
    )

    client.on(
      "reconnect",
      () => {

        console.log(
          "MQTT RECONNECTING..."
        )
      }
    )

    return client

  } catch (err) {

    console.error(
      "connectMQTT failed:",
      err
    )
  }
}

export function disconnectMQTT() {

  try {

    if (client) {

      client.end(true)

      client = null

      console.log(
        "MQTT disconnected"
      )
    }

  } catch (err) {

    console.error(
      "disconnectMQTT error:",
      err
    )
  }
}
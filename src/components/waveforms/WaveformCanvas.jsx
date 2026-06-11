import {
  useEffect,
  useRef,
} from "react"

function drawGrid(
  ctx,
  width,
  height
) {

  ctx.strokeStyle =
    "rgba(255,255,255,0.025)"

  ctx.lineWidth = 1

  const gap = 25

  // Vertical grid
  for (
    let x = 0;
    x < width;
    x += gap
  ) {

    ctx.beginPath()

    ctx.moveTo(x, 0)

    ctx.lineTo(x, height)

    ctx.stroke()
  }

  // Horizontal grid
  for (
    let y = 0;
    y < height;
    y += gap
  ) {

    ctx.beginPath()

    ctx.moveTo(0, y)

    ctx.lineTo(width, y)

    ctx.stroke()
  }
}

export default function WaveformCanvas({

  buffer,

  color = "#4dff88",

  min = 0,

  max = 50,
}) {

  const canvasRef =
    useRef(null)

  useEffect(() => {

    const canvas =
      canvasRef.current

    if (!canvas) return

    const ctx =
      canvas.getContext("2d")

    let animationId

    function render() {

      const width =
        canvas.clientWidth

      const height =
        canvas.clientHeight
        const plotTop = 6

const plotBottom = height - 18

const plotLeft = 44
const plotRight = width - 10

const plotWidth =
  plotRight - plotLeft

const plotHeight =
  plotBottom - plotTop

      // Retina scaling
      const dpr =
        window.devicePixelRatio || 1

      if (
        canvas.width !==
          width * dpr ||
        canvas.height !==
          height * dpr
      ) {

        canvas.width =
          width * dpr

        canvas.height =
          height * dpr

        ctx.scale(dpr, dpr)
      }

      // Background
      ctx.fillStyle =
        "#081018"

      ctx.fillRect(
        0,
        0,
        width,
        height
      )

     // Grid
drawGrid(
  ctx,
  width,
  height
)

// =================================================
// AXES
// =================================================

ctx.strokeStyle =
  "rgba(255,255,255,0.25)"

ctx.lineWidth = 1

// Y axis
ctx.beginPath()

ctx.moveTo(
  40,
  plotTop
)

ctx.lineTo(
  40,
  plotBottom
)

ctx.stroke()

// X axis
ctx.beginPath()

ctx.moveTo(
  40,
  plotBottom
)

ctx.lineTo(
  width - 8,
  plotBottom
)

ctx.stroke()

// =================================================
// Y AXIS LABELS
// =================================================

ctx.fillStyle =
  "rgba(255,255,255,0.7)"

ctx.font =
  "11px sans-serif"

ctx.textAlign = "right"

// Top value
ctx.fillText(
  max,
  34,
  16
)

// Mid value
ctx.fillText(
  Math.round(
    (max + min) / 2
  ),
  34,
  height / 2
)

// Bottom value
ctx.fillText(
  min,
  34,
  plotBottom + 4
)

// =================================================
// X AXIS LABELS
// =================================================

ctx.textAlign = "center"

const xSteps = 5

for (
  let i = 0;
  i <= xSteps;
  i++
) {

  const x =
    40 +
    (
      (width - 48) /
      xSteps
    ) * i

  const visibleSeconds = 15

const label =
  (
    (visibleSeconds / xSteps) *
    i
  ).toFixed(1)

  ctx.fillText(
    label,
    x,
    height - 8
  )
}

// =================================================
// WAVEFORM LINE
// =================================================
     
      ctx.beginPath()

      ctx.strokeStyle =
        color
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.lineWidth = 2.5

      // IMPORTANT FIX
const samples =
  buffer?.samples || []

console.log(
  "MIN BUFFER:",
  Math.min(...samples),
  "MAX BUFFER:",
  Math.max(...samples)
)

// Prevent empty render
if (samples.length < 2) {

  animationId =
    requestAnimationFrame(
      render
    )

  return
}
      const samplesPerSecond = 20
      const visibleSeconds = 15
      const visibleSamples = samplesPerSecond * visibleSeconds
      const startIndex =
  Math.max(
    0,
    samples.length -
      visibleSamples
  )

for (
  let x = 0;
  x < visibleSamples;
  x++
) {

  const sampleIndex =
    startIndex + x

  if (
    sampleIndex >=
    samples.length
  ) {
    break
  }

  const value =
    samples[sampleIndex]

if (value < 0) {
  console.log(
    "NEGATIVE VALUE:",
    value
  )
}
  const safeValue =
  Math.max(
    min,
    Math.min(
      max,
      value
    )
  )

const normalized =
  (safeValue - min) /
  (max - min)


  let y =
    plotBottom -
    normalized *
      plotHeight

  // Keep waveform inside graph area
  y = Math.max(
    plotTop,
    Math.min(
      plotBottom,
      y
    )
  )

  const drawX =
    plotLeft +
    (x / visibleSamples) *
      plotWidth

  if (x === 0) {

    ctx.moveTo(
      drawX,
      y
    )

  } else {

    ctx.lineTo(
      drawX,
      y
    )
  }
}

ctx.stroke()

      animationId =
        requestAnimationFrame(
          render
        )
    }

    render()

    return () => {

      cancelAnimationFrame(
        animationId
      )
    }

  }, [buffer, color, min, max])

  return (

    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "150px",
        display: "block",
        borderRadius: "12px",
      }}
    />
  )
}
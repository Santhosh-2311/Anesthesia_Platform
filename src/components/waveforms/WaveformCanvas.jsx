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
    "rgba(255,255,255,0.05)"

  ctx.lineWidth = 1

  const gap = 32

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

ctx.moveTo(40, 8)

ctx.lineTo(40, height - 24)

ctx.stroke()

// X axis
ctx.beginPath()

ctx.moveTo(
  40,
  height - 24
)

ctx.lineTo(
  width - 8,
  height - 24
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
  height - 28
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

  const totalSeconds = 5

const label =
  (
    (totalSeconds / xSteps) *
    i
  ).toFixed(0)

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

      ctx.lineWidth = 2

      // IMPORTANT FIX
      const samples =
        buffer?.samples || []

      // Prevent empty render
      if (samples.length < 2) {

        animationId =
          requestAnimationFrame(
            render
          )

        return
      }

      const visibleSamples =
  Math.min(
    samples.length,
    width
  )

const startIndex =
  Math.max(
    0,
    samples.length -
      visibleSamples
  )

const plotLeft = 44
const plotRight = width - 10

const plotTop = 10
const plotBottom = height - 24

const plotWidth =
  plotRight - plotLeft

const plotHeight =
  plotBottom - plotTop

for (
  let x = 0;
  x < visibleSamples;
  x++
)
 {

  const value =
    samples[
      startIndex + x
    ]

        const normalized =
  (value - min) /
  (max - min)

// Add top/bottom padding
const padding = 12

const drawableHeight =
  height - padding * 2

const plotTop = 12
const plotBottom = height - 24

const plotHeight =
  plotBottom - plotTop

let y =
  plotBottom -
  normalized *
    plotHeight

// Prevent overflow
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

  ctx.moveTo(drawX, y)

} else {

  ctx.lineTo(drawX, y)
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
        height: "120px",
        display: "block",
        borderRadius: "12px",
      }}
    />
  )
}
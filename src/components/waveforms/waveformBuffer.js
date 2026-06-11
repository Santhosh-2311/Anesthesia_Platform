// src/components/waveforms/waveformBuffer.js

export function createWaveBuffer(
  maxSamples = 1096
) {
  return {
    samples: [],
    maxSamples,
  }
    console.warn(
    "BUFFER CREATED",
    new Date().toISOString()
  )
}

export function appendSamples(
  buffer,
  incomingSamples
) {
  console.log(
  "BUFFER LENGTH:",
  buffer.samples.length
)
  if (
    !buffer ||
    !incomingSamples ||
    !Array.isArray(incomingSamples)
  ) {
    return
  }

  buffer.samples.push(
    ...incomingSamples
  )

  // Maintain rolling window
  if (
    buffer.samples.length >
    buffer.maxSamples
  ) {
    const excess =
      buffer.samples.length -
      buffer.maxSamples

    buffer.samples.splice(0, excess)
  }
}
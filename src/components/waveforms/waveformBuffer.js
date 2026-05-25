// src/components/waveforms/waveformBuffer.js

export function createWaveBuffer(
  maxSamples = 4096
) {
  return {
    samples: [],
    maxSamples,
  }
}

export function appendSamples(
  buffer,
  incomingSamples
) {
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
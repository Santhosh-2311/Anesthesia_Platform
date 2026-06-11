// src/components/waveforms/waveformStore.js

import {
  createWaveBuffer
}
from "./waveforms/waveformBuffer"

export const pressureBuffer =
  createWaveBuffer(4096)

export const flowBuffer =
  createWaveBuffer(8096)

export const etco2Buffer =
  createWaveBuffer(8096)
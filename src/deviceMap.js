export const UI_TO_BACKEND_DEVICE = {
  "AW-001": "anesthesia_001",
  "AW-002": "anesthesia_002",
}

export function mapUiDeviceToBackend(uiId) {
  return UI_TO_BACKEND_DEVICE[uiId] || uiId
}

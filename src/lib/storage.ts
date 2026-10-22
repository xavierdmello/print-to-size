const PREFIX = 'print-to-frame:'

export function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key)
  } catch {
    return null
  }
}

export function writeSetting(key: string, value: string): void {
  try {
    localStorage.setItem(PREFIX + key, value)
  } catch {
    // Private browsing or blocked storage: the setting just isn't remembered.
  }
}

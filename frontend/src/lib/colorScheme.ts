import type { ColorSchemeId } from '../types'

const ATTR = 'data-color-scheme'

const VALID: ColorSchemeId[] = [
  'default',
  'slate',
  'graphite',
  'indigo',
  'forest',
  'rose',
]

export function isColorSchemeId(v: unknown): v is ColorSchemeId {
  return typeof v === 'string' && (VALID as string[]).includes(v)
}

/** Apply semantic surface tokens for the app shell and editor chrome. */
export function applyColorScheme(scheme: ColorSchemeId) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute(ATTR, scheme)
}

export function readStoredColorScheme(): ColorSchemeId | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('scholarly-notes-settings-v1')
    if (raw) {
      const j = JSON.parse(raw) as Record<string, unknown>
      if (isColorSchemeId(j.colorScheme)) return j.colorScheme
    }
  } catch {
    /* ignore */
  }
  return null
}

import type { ThemePreference } from '../types'

export function resolveThemePreference(p: ThemePreference): 'light' | 'dark' {
  if (p === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return p
}

export function applyResolvedTheme(resolved: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

export function applyThemePreference(p: ThemePreference) {
  applyResolvedTheme(resolveThemePreference(p))
}

const LEGACY_THEME_KEY = 'notes-app-theme'

/** Read settings JSON theme or migrate legacy `notes-app-theme` (light|dark only). */
export function readStoredThemePreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('scholarly-notes-settings-v1')
    if (raw) {
      const j = JSON.parse(raw) as { state?: { themePreference?: string } }
      const p = j.state?.themePreference
      if (p === 'light' || p === 'dark' || p === 'system') return p
    }
  } catch {
    /* ignore */
  }
  const leg = localStorage.getItem(LEGACY_THEME_KEY)
  if (leg === 'light' || leg === 'dark') return leg
  return null
}

export function subscribeSystemTheme(onChange: () => void) {
  if (typeof window === 'undefined') return () => {}
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

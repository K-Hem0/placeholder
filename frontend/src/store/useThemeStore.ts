/**
 * @deprecated Theme is configured via `useSettingsStore` + `lib/theme.ts`.
 * Re-exported for any stale imports during migration.
 */
import { useSettingsStore } from './useSettingsStore'

export type ThemeMode = 'light' | 'dark'

export function getInitialTheme(): ThemeMode {
  const p = useSettingsStore.getState().themePreference
  if (p === 'dark') return 'dark'
  if (p === 'light') return 'light'
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

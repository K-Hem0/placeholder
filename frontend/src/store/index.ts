export { useAppStore, createEmptyNote } from './useAppStore'

/** Stable localStorage key segment for references when no note is open (no saves). */
export function noteIdForReferences(noteId: string | null): string {
  return noteId ?? '__none__'
}
export { useSettingsStore } from './useSettingsStore'
export type { SettingsState } from './useSettingsStore'
export { getInitialTheme } from './useThemeStore'

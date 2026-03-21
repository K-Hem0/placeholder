import { create } from 'zustand'
import type {
  ColorSchemeId,
  EditorMaxWidth,
  NoteSort,
  NoteTemplateId,
  ThemePreference,
} from '../types'
import { applyThemePreference } from '../lib/theme'
import { applyColorScheme, isColorSchemeId } from '../lib/colorScheme'
import { migrateLegacyNoteTemplateId } from '../lib/templateRegistry'
import {
  DEFAULT_LEFT_PANE_PX,
  DEFAULT_RIGHT_PANE_PX,
  MIN_LEFT_PANE_PX,
  MIN_RIGHT_PANE_PX,
} from '../lib/paneLayout'

const SETTINGS_KEY = 'scholarly-notes-settings-v1'

export type SettingsState = {
  themePreference: ThemePreference
  colorScheme: ColorSchemeId
  compactMode: boolean
  editorMaxWidth: EditorMaxWidth
  lineFocus: boolean
  distractionFree: boolean
  defaultTemplate: NoteTemplateId
  sortNotes: NoteSort
  confirmBeforeDelete: boolean
  leftSidebarCollapsed: boolean
  rightSidebarCollapsed: boolean
  /** Notes column width (px), excluding the icon rail. */
  leftPaneWidthPx: number
  /** Right utility sidebar width (px). */
  rightPaneWidthPx: number
  settingsOpen: boolean
  setThemePreference: (t: ThemePreference) => void
  setColorScheme: (s: ColorSchemeId) => void
  setCompactMode: (v: boolean) => void
  setEditorMaxWidth: (v: EditorMaxWidth) => void
  setLineFocus: (v: boolean) => void
  setDistractionFree: (v: boolean) => void
  setDefaultTemplate: (v: NoteTemplateId) => void
  setSortNotes: (v: NoteSort) => void
  setConfirmBeforeDelete: (v: boolean) => void
  setLeftSidebarCollapsed: (v: boolean) => void
  setRightSidebarCollapsed: (v: boolean) => void
  /** When `persist` is false (e.g. during drag), call `flushSettingsPersist` after. */
  setLeftPaneWidthPx: (v: number, persist?: boolean) => void
  setRightPaneWidthPx: (v: number, persist?: boolean) => void
  resetPaneWidths: () => void
  setSettingsOpen: (v: boolean) => void
}

const defaults: Omit<
  SettingsState,
  | 'setThemePreference'
  | 'setColorScheme'
  | 'setCompactMode'
  | 'setEditorMaxWidth'
  | 'setLineFocus'
  | 'setDistractionFree'
  | 'setDefaultTemplate'
  | 'setSortNotes'
  | 'setConfirmBeforeDelete'
  | 'setLeftSidebarCollapsed'
  | 'setRightSidebarCollapsed'
  | 'setLeftPaneWidthPx'
  | 'setRightPaneWidthPx'
  | 'resetPaneWidths'
  | 'setSettingsOpen'
> = {
  themePreference: 'system',
  colorScheme: 'default',
  compactMode: false,
  editorMaxWidth: 'medium',
  lineFocus: false,
  distractionFree: false,
  defaultTemplate: 'blank',
  sortNotes: 'updated',
  confirmBeforeDelete: true,
  leftSidebarCollapsed: false,
  rightSidebarCollapsed: false,
  leftPaneWidthPx: DEFAULT_LEFT_PANE_PX,
  rightPaneWidthPx: DEFAULT_RIGHT_PANE_PX,
  settingsOpen: false,
}

function loadSnapshot(): Partial<SettingsState> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>
      return sanitizeSettings(parsed)
    }
  } catch {
    /* ignore */
  }
  const leg = localStorage.getItem('notes-app-theme')
  if (leg === 'light' || leg === 'dark') {
    return { themePreference: leg }
  }
  return {}
}

function sanitizeSettings(
  parsed: Record<string, unknown>
): Partial<SettingsState> {
  const o: Partial<SettingsState> = {}
  const tp = parsed.themePreference
  if (tp === 'light' || tp === 'dark' || tp === 'system')
    o.themePreference = tp
  const cs = parsed.colorScheme
  if (isColorSchemeId(cs)) o.colorScheme = cs
  if (typeof parsed.compactMode === 'boolean') o.compactMode = parsed.compactMode
  const em = parsed.editorMaxWidth
  if (em === 'narrow' || em === 'medium' || em === 'wide')
    o.editorMaxWidth = em
  if (typeof parsed.lineFocus === 'boolean') o.lineFocus = parsed.lineFocus
  if (typeof parsed.distractionFree === 'boolean')
    o.distractionFree = parsed.distractionFree
  const dt = parsed.defaultTemplate
  if (typeof dt === 'string') {
    const migrated = migrateLegacyNoteTemplateId(dt)
    if (migrated) o.defaultTemplate = migrated
  }
  const sn = parsed.sortNotes
  if (sn === 'updated' || sn === 'created' || sn === 'title')
    o.sortNotes = sn
  if (typeof parsed.confirmBeforeDelete === 'boolean')
    o.confirmBeforeDelete = parsed.confirmBeforeDelete
  if (typeof parsed.leftSidebarCollapsed === 'boolean')
    o.leftSidebarCollapsed = parsed.leftSidebarCollapsed
  if (typeof parsed.rightSidebarCollapsed === 'boolean')
    o.rightSidebarCollapsed = parsed.rightSidebarCollapsed
  const lp = parsed.leftPaneWidthPx
  if (typeof lp === 'number' && Number.isFinite(lp))
    o.leftPaneWidthPx = Math.max(MIN_LEFT_PANE_PX, lp)
  const rp = parsed.rightPaneWidthPx
  if (typeof rp === 'number' && Number.isFinite(rp))
    o.rightPaneWidthPx = Math.max(MIN_RIGHT_PANE_PX, rp)
  return o
}

function persist(state: SettingsState) {
  const blob = {
    themePreference: state.themePreference,
    colorScheme: state.colorScheme,
    compactMode: state.compactMode,
    editorMaxWidth: state.editorMaxWidth,
    lineFocus: state.lineFocus,
    distractionFree: state.distractionFree,
    defaultTemplate: state.defaultTemplate,
    sortNotes: state.sortNotes,
    confirmBeforeDelete: state.confirmBeforeDelete,
    leftSidebarCollapsed: state.leftSidebarCollapsed,
    rightSidebarCollapsed: state.rightSidebarCollapsed,
    leftPaneWidthPx: state.leftPaneWidthPx,
    rightPaneWidthPx: state.rightPaneWidthPx,
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(blob))
}

/** Write current settings (including pane widths) to localStorage. */
export function flushSettingsPersist() {
  persist(useSettingsStore.getState())
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaults,
  ...loadSnapshot(),
  settingsOpen: false,

  setThemePreference: (themePreference) => {
    set({ themePreference })
    applyThemePreference(themePreference)
    persist(get())
  },

  setColorScheme: (colorScheme) => {
    set({ colorScheme })
    applyColorScheme(colorScheme)
    persist(get())
  },

  setCompactMode: (compactMode) => {
    set({ compactMode })
    persist(get())
  },

  setEditorMaxWidth: (editorMaxWidth) => {
    set({ editorMaxWidth })
    persist(get())
  },

  setLineFocus: (lineFocus) => {
    set({ lineFocus })
    persist(get())
  },

  setDistractionFree: (distractionFree) => {
    set({ distractionFree })
    persist(get())
  },

  setDefaultTemplate: (defaultTemplate) => {
    set({ defaultTemplate })
    persist(get())
  },

  setSortNotes: (sortNotes) => {
    set({ sortNotes })
    persist(get())
  },

  setConfirmBeforeDelete: (confirmBeforeDelete) => {
    set({ confirmBeforeDelete })
    persist(get())
  },

  setLeftSidebarCollapsed: (leftSidebarCollapsed) => {
    set({ leftSidebarCollapsed })
    persist(get())
  },

  setRightSidebarCollapsed: (rightSidebarCollapsed) => {
    set({ rightSidebarCollapsed })
    persist(get())
  },

  setLeftPaneWidthPx: (leftPaneWidthPx, shouldPersist = true) => {
    set({ leftPaneWidthPx })
    if (shouldPersist) persist(get())
  },

  setRightPaneWidthPx: (rightPaneWidthPx, shouldPersist = true) => {
    set({ rightPaneWidthPx })
    if (shouldPersist) persist(get())
  },

  resetPaneWidths: () => {
    set({
      leftPaneWidthPx: DEFAULT_LEFT_PANE_PX,
      rightPaneWidthPx: DEFAULT_RIGHT_PANE_PX,
    })
    persist(get())
  },

  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
}))

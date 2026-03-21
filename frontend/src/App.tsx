import { useEffect, useRef } from 'react'
import { EditorPane } from './components/editor/EditorPane'
import { NoteList } from './components/layout/NoteList'
import { Sidebar } from './components/layout/Sidebar'
import { AppShell } from './components/layout/AppShell'
import { loadPersistedState, savePersistedState } from './lib/storage'
import { AUTOSAVE_TO_DISK_MS } from './lib/versionHistoryPolicy'
import { useAppStore } from './store'
import { useSettingsStore } from './store/useSettingsStore'
import {
  applyThemePreference,
  subscribeSystemTheme,
} from './lib/theme'
import { applyColorScheme } from './lib/colorScheme'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function App() {
  useKeyboardShortcuts()
  const notes = useAppStore((s) => s.notes)
  const versionsByNoteId = useAppStore((s) => s.versionsByNoteId)
  const skipSaveRef = useRef(true)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestRef = useRef({ notes, versionsByNoteId })
  latestRef.current = { notes, versionsByNoteId }
  const themePreference = useSettingsStore((s) => s.themePreference)
  const colorScheme = useSettingsStore((s) => s.colorScheme)

  useEffect(() => {
    const loaded = loadPersistedState()
    useAppStore.setState({
      notes: loaded.notes,
      versionsByNoteId: loaded.versionsByNoteId,
      currentNoteId: loaded.notes[0]?.id ?? null,
    })
  }, [])

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false
      return
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null
      const { notes: n, versionsByNoteId: v } = latestRef.current
      savePersistedState({ notes: n, versionsByNoteId: v })
    }, AUTOSAVE_TO_DISK_MS)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [notes, versionsByNoteId])

  useEffect(() => {
    const flush = () => {
      const { notes: n, versionsByNoteId: v } = latestRef.current
      savePersistedState({ notes: n, versionsByNoteId: v })
    }
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onHide)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onHide)
    }
  }, [])

  useEffect(() => {
    applyThemePreference(themePreference)
  }, [themePreference])

  useEffect(() => {
    applyColorScheme(colorScheme)
  }, [colorScheme])

  useEffect(() => {
    if (themePreference !== 'system') return
    return subscribeSystemTheme(() => {
      applyThemePreference('system')
    })
  }, [themePreference])

  return (
    <AppShell
      left={<NoteList />}
      editor={<EditorPane />}
      right={<Sidebar />}
    />
  )
}

import { useCallback, useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import type { EditorMode } from '../types'
import {
  HISTORY_IDLE_SNAPSHOT_MS,
  shouldCreateHistorySnapshot,
  type HistorySnapshotReason,
} from '../lib/versionHistoryPolicy'

type UseNoteHistorySnapshotArgs = {
  noteId: string
  editorMode: EditorMode
}

/**
 * Centralized version history: idle checkpoints, note switch, blur, periodic safety.
 * The note model in the store should update immediately on edit; disk persistence is debounced in App.
 */
export function useNoteHistorySnapshot({
  noteId,
  editorMode,
}: UseNoteHistorySnapshotArgs): {
  /** Call after local content has been written to the store for this note. */
  onEditorModelUpdated: () => void
} {
  const pushVersionSnapshot = useAppStore((s) => s.pushVersionSnapshot)

  const lastSnapRef = useRef<string>('')
  const lastSnapshotAtRef = useRef<number>(0)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteIdRef = useRef(noteId)
  noteIdRef.current = noteId

  const trySnapshot = useCallback(
    (targetNoteId: string, reason: HistorySnapshotReason, baseline: string) => {
      const now = Date.now()
      const n = useAppStore.getState().notes.find((x) => x.id === targetNoteId)
      if (!n) return
      const prev = baseline
      const next = n.content
      if (
        !shouldCreateHistorySnapshot({
          previous: prev,
          next,
          lastSnapshotAt: lastSnapshotAtRef.current,
          now,
          mode: editorMode,
          reason,
        })
      ) {
        return
      }
      pushVersionSnapshot(targetNoteId, prev, next, n.title)
      if (targetNoteId === noteIdRef.current) {
        lastSnapRef.current = next
        lastSnapshotAtRef.current = now
      }
    },
    [editorMode, pushVersionSnapshot]
  )

  const trySnapshotRef = useRef(trySnapshot)
  trySnapshotRef.current = trySnapshot

  useEffect(() => {
    const n = useAppStore.getState().notes.find((x) => x.id === noteId)
    const content = n?.content ?? ''
    lastSnapRef.current = content
    lastSnapshotAtRef.current = Date.now()
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [noteId])

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current)
        idleTimerRef.current = null
      }
      trySnapshotRef.current(noteId, 'note_switch', lastSnapRef.current)
    }
  }, [noteId])

  const scheduleIdleSnapshot = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      idleTimerRef.current = null
      const id = noteIdRef.current
      trySnapshot(id, 'idle', lastSnapRef.current)
    }, HISTORY_IDLE_SNAPSHOT_MS)
  }, [trySnapshot])

  const onEditorModelUpdated = () => {
    scheduleIdleSnapshot()
  }

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        trySnapshot(noteIdRef.current, 'blur', lastSnapRef.current)
      }
    }
    const onWinBlur = () => {
      trySnapshot(noteIdRef.current, 'blur', lastSnapRef.current)
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onWinBlur)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onWinBlur)
    }
  }, [trySnapshot])

  useEffect(() => {
    const id = window.setInterval(() => {
      trySnapshot(noteIdRef.current, 'periodic_safety', lastSnapRef.current)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [trySnapshot])

  return { onEditorModelUpdated }
}

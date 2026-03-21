import type { Note, NoteVersion } from '../types'
import {
  LEGACY_NOTES_KEY,
  STORAGE_ROOT_KEY,
  type PersistedAppStateV1,
} from './schema'

function isNote(value: unknown): value is Note {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    typeof o.content === 'string' &&
    Array.isArray(o.tags) &&
    o.tags.every((t) => typeof t === 'string') &&
    typeof o.folder === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.updatedAt === 'string'
  )
}

function isNoteVersion(value: unknown): value is NoteVersion {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.createdAt === 'string' &&
    typeof o.content === 'string'
  )
}

function isPersistedV1(value: unknown): value is PersistedAppStateV1 {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  if (o.version !== 1) return false
  if (!Array.isArray(o.notes)) return false
  if (!o.notes.every(isNote)) return false
  if (typeof o.versionsByNoteId !== 'object' || o.versionsByNoteId === null)
    return false
  const map = o.versionsByNoteId as Record<string, unknown>
  for (const k of Object.keys(map)) {
    const arr = map[k]
    if (!Array.isArray(arr) || !arr.every(isNoteVersion)) return false
  }
  return true
}

function loadLegacyNotesOnly(): Note[] {
  const raw = localStorage.getItem(LEGACY_NOTES_KEY)
  if (raw == null) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isNote)
  } catch {
    return []
  }
}

export function loadPersistedState(): {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
} {
  const raw = localStorage.getItem(STORAGE_ROOT_KEY)
  if (raw != null) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isPersistedV1(parsed)) {
        return {
          notes: parsed.notes,
          versionsByNoteId: parsed.versionsByNoteId,
        }
      }
    } catch {
      /* fall through */
    }
  }

  const legacy = loadLegacyNotesOnly()
  if (legacy.length > 0) {
    return { notes: legacy, versionsByNoteId: {} }
  }

  return { notes: [], versionsByNoteId: {} }
}

export function savePersistedState(state: {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
}): void {
  const payload: PersistedAppStateV1 = {
    version: 1,
    notes: state.notes,
    versionsByNoteId: state.versionsByNoteId,
  }
  localStorage.setItem(STORAGE_ROOT_KEY, JSON.stringify(payload))
  localStorage.removeItem(LEGACY_NOTES_KEY)
}

/** @deprecated Use savePersistedState — kept for any external callers */
export function saveNotes(notes: Note[]): void {
  savePersistedState({ notes, versionsByNoteId: {} })
}

/** @deprecated Use loadPersistedState */
export function loadNotes(): Note[] {
  return loadPersistedState().notes
}

export function exportStateJson(state: {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
}): string {
  return JSON.stringify(
    { version: 1 as const, notes: state.notes, versionsByNoteId: state.versionsByNoteId },
    null,
    2
  )
}

export function parseImportedStateJson(
  raw: string
): { notes: Note[]; versionsByNoteId: Record<string, NoteVersion[]> } | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isPersistedV1(parsed)) {
      return { notes: parsed.notes, versionsByNoteId: parsed.versionsByNoteId }
    }
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { notes?: unknown }).notes) &&
      (parsed as { notes: unknown[] }).notes.every(isNote)
    ) {
      return {
        notes: (parsed as { notes: Note[] }).notes,
        versionsByNoteId:
          typeof (parsed as { versionsByNoteId?: unknown }).versionsByNoteId ===
            'object' &&
          (parsed as { versionsByNoteId?: unknown }).versionsByNoteId !== null
            ? ((parsed as { versionsByNoteId: Record<string, NoteVersion[]> })
                .versionsByNoteId ?? {})
            : {},
      }
    }
  } catch {
    return null
  }
  return null
}

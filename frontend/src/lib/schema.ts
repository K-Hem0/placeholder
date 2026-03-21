/**
 * Storage schema (v1) — persisted in localStorage today; swappable for IndexedDB/SQLite later.
 *
 * Keys:
 * - `scholarly-notes-v1` — root blob (see PersistedAppState)
 * - Legacy `notes` key is migrated once on load if present
 */

import type { Note, NoteVersion } from '../types'

/** Single JSON document for atomic-ish persistence */
export type PersistedAppStateV1 = {
  version: 1
  notes: Note[]
  /** Parallel map: note id → version snapshots (newest last or first — see versionHistory helpers) */
  versionsByNoteId: Record<string, NoteVersion[]>
}

export const STORAGE_ROOT_KEY = 'scholarly-notes-v1'
export const LEGACY_NOTES_KEY = 'notes'

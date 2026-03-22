/**
 * Storage schema (v1) — persisted in localStorage today; swappable for IndexedDB/SQLite later.
 *
 * Keys:
 * - `daftar-v1` — root blob (see PersistedAppState)
 * - Legacy `notes` and `scholarly-notes-v1` migrated on load if present
 */

import type { Note, NoteVersion, Reference } from '../types'

/** Single JSON document for atomic-ish persistence */
export type PersistedAppStateV1 = {
  version: 1
  notes: Note[]
  /** Parallel map: note id → version snapshots (newest last or first — see versionHistory helpers) */
  versionsByNoteId: Record<string, NoteVersion[]>
  /** Optional since early v1 blobs; validated against `notes` on load */
  currentNoteId?: string | null
  /** Saved literature references keyed by note id (optional for older blobs) */
  referencesByNoteId?: Record<string, Reference[]>
}

export const STORAGE_ROOT_KEY = 'daftar-v1'
export const LEGACY_STORAGE_KEY = 'scholarly-notes-v1'
export const LEGACY_NOTES_KEY = 'notes'

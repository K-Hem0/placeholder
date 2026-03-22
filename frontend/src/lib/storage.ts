import type { EditorMode, Note, NoteVersion, Reference } from '../types'
import { normalizeNoteForApp } from './noteNormalization'
import { normalizePersistedNote } from './noteMigration'
import {
  LEGACY_NOTES_KEY,
  LEGACY_STORAGE_KEY,
  STORAGE_ROOT_KEY,
  type PersistedAppStateV1,
} from './schema'

function isEditorMode(v: unknown): v is EditorMode {
  return v === 'rich' || v === 'latex'
}

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
    typeof o.updatedAt === 'string' &&
    (o.editorMode === undefined || isEditorMode(o.editorMode))
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

function isReference(value: unknown): value is Reference {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  return (
    typeof o.id === 'string' &&
    typeof o.title === 'string' &&
    Array.isArray(o.authors) &&
    o.authors.every((t) => typeof t === 'string') &&
    typeof o.year === 'number' &&
    typeof o.abstract === 'string' &&
    typeof o.url === 'string' &&
    typeof o.credibility === 'number' &&
    (o.venue === undefined || typeof o.venue === 'string') &&
    (o.citationCount === undefined || typeof o.citationCount === 'number')
  )
}

function isReferencesByNoteId(
  value: unknown
): value is Record<string, Reference[]> {
  if (value === null || typeof value !== 'object') return false
  const o = value as Record<string, unknown>
  for (const k of Object.keys(o)) {
    const arr = o[k]
    if (!Array.isArray(arr) || !arr.every(isReference)) return false
  }
  return true
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
  if ('currentNoteId' in o) {
    const c = o.currentNoteId
    if (c != null && typeof c !== 'string') return false
  }
  if ('referencesByNoteId' in o && o.referencesByNoteId != null) {
    if (!isReferencesByNoteId(o.referencesByNoteId)) return false
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
  currentNoteId?: string | null
  referencesByNoteId: Record<string, Reference[]>
} {
  let raw = localStorage.getItem(STORAGE_ROOT_KEY)
  if (raw == null) {
    raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw != null) {
      try {
        const parsed: unknown = JSON.parse(raw)
        if (isPersistedV1(parsed)) {
          const state = {
            notes: parsed.notes.map((n) =>
              normalizeNoteForApp(normalizePersistedNote(n))
            ),
            versionsByNoteId: parsed.versionsByNoteId,
            currentNoteId: parsed.currentNoteId,
            referencesByNoteId: parsed.referencesByNoteId ?? {},
          }
          savePersistedState(state)
          localStorage.removeItem(LEGACY_STORAGE_KEY)
          return state
        }
      } catch {
        /* fall through */
      }
    }
  }
  if (raw != null) {
    try {
      const parsed: unknown = JSON.parse(raw)
      if (isPersistedV1(parsed)) {
        return {
          notes: parsed.notes.map((n) =>
            normalizeNoteForApp(normalizePersistedNote(n))
          ),
          versionsByNoteId: parsed.versionsByNoteId,
          currentNoteId: parsed.currentNoteId,
          referencesByNoteId: parsed.referencesByNoteId ?? {},
        }
      }
    } catch {
      /* fall through */
    }
  }

  const legacy = loadLegacyNotesOnly()
  if (legacy.length > 0) {
    return {
      notes: legacy.map((n) =>
        normalizeNoteForApp(normalizePersistedNote(n))
      ),
      versionsByNoteId: {},
      referencesByNoteId: {},
    }
  }

  return { notes: [], versionsByNoteId: {}, referencesByNoteId: {} }
}

export function savePersistedState(state: {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
  currentNoteId?: string | null
  referencesByNoteId?: Record<string, Reference[]>
}): void {
  const payload: PersistedAppStateV1 = {
    version: 1,
    notes: state.notes,
    versionsByNoteId: state.versionsByNoteId,
    currentNoteId: state.currentNoteId,
    referencesByNoteId: state.referencesByNoteId ?? {},
  }
  localStorage.setItem(STORAGE_ROOT_KEY, JSON.stringify(payload))
  localStorage.removeItem(LEGACY_NOTES_KEY)
}

/** @deprecated Use savePersistedState — kept for any external callers */
export function saveNotes(notes: Note[]): void {
  savePersistedState({
    notes,
    versionsByNoteId: {},
    currentNoteId: null,
    referencesByNoteId: {},
  })
}

/** @deprecated Use loadPersistedState */
export function loadNotes(): Note[] {
  return loadPersistedState().notes
}

const NOTE_SEPARATOR = '\n\n<!-- NOTE -->\n\n'

function escapeYamlValue(s: string): string {
  if (/[\n:]/.test(s) || s.startsWith(' ') || s.startsWith('#')) {
    return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`
  }
  return s
}

export function exportStateMarkdown(state: {
  notes: Note[]
  currentNoteId?: string | null
}): string {
  const blocks: string[] = []
  for (const note of state.notes) {
    const frontmatter = [
      `title: ${escapeYamlValue(note.title)}`,
      `folder: ${escapeYamlValue(note.folder)}`,
      `tags: ${escapeYamlValue(note.tags.join(', '))}`,
      `id: ${note.id}`,
      `createdAt: ${note.createdAt}`,
      `updatedAt: ${note.updatedAt}`,
      ...(note.editorMode ? [`editorMode: ${note.editorMode}`] : []),
    ].join('\n')
    blocks.push(`---\n${frontmatter}\n---\n\n${note.content || ''}`)
  }
  return blocks.join(NOTE_SEPARATOR)
}

function parseFrontmatterBlock(block: string): { meta: Record<string, string>; content: string } | null {
  const match = block.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) return null
  const [, yaml, content] = match
  const meta: Record<string, string> = {}
  for (const line of yaml.split(/\r?\n/)) {
    const colonIdx = line.indexOf(':')
    if (colonIdx < 0) continue
    const key = line.slice(0, colonIdx).trim()
    let val = line.slice(colonIdx + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n')
    }
    meta[key] = val
  }
  return { meta, content: content || '' }
}

export function parseImportedStateMarkdown(
  raw: string
): {
  notes: Note[]
  currentNoteId?: string | null
} | null {
  const blocks = raw.split(NOTE_SEPARATOR)
  const notes: Note[] = []
  const now = new Date().toISOString()
  for (const block of blocks) {
    const parsed = parseFrontmatterBlock(block.trim())
    if (!parsed) {
      const t = block.trim()
      if (t) {
        notes.push({
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          title: 'Untitled',
          content: t,
          tags: [],
          folder: '',
          editorMode: 'latex',
          createdAt: now,
          updatedAt: now,
        })
      }
      continue
    }
    const { meta, content } = parsed
    const title = meta.title ?? 'Untitled'
    const id = meta.id ?? `note-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const folder = meta.folder ?? ''
    const tags = meta.tags
      ? meta.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : []
    notes.push({
      id,
      title,
      content,
      tags,
      folder,
      editorMode: (meta.editorMode === 'latex' ? 'latex' : 'rich') as EditorMode,
      createdAt: meta.createdAt ?? now,
      updatedAt: meta.updatedAt ?? now,
    })
  }
  if (notes.length === 0) return null
  return { notes, currentNoteId: notes[0]?.id ?? null }
}

/** @deprecated Use exportStateMarkdown */
export function exportStateJson(state: {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
  currentNoteId?: string | null
  referencesByNoteId?: Record<string, Reference[]>
}): string {
  return JSON.stringify(
    {
      version: 1 as const,
      notes: state.notes,
      versionsByNoteId: state.versionsByNoteId,
      currentNoteId: state.currentNoteId,
      referencesByNoteId: state.referencesByNoteId ?? {},
    },
    null,
    2
  )
}

/** @deprecated Use parseImportedStateMarkdown */
export function parseImportedStateJson(
  raw: string
): {
  notes: Note[]
  versionsByNoteId: Record<string, NoteVersion[]>
  currentNoteId?: string | null
  referencesByNoteId: Record<string, Reference[]>
} | null {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (isPersistedV1(parsed)) {
      return {
        notes: parsed.notes.map((n) =>
          normalizeNoteForApp(normalizePersistedNote(n))
        ),
        versionsByNoteId: parsed.versionsByNoteId,
        currentNoteId: parsed.currentNoteId,
        referencesByNoteId: parsed.referencesByNoteId ?? {},
      }
    }
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      Array.isArray((parsed as { notes?: unknown }).notes) &&
      (parsed as { notes: unknown[] }).notes.every(isNote)
    ) {
      const loose = parsed as {
        notes: Note[]
        versionsByNoteId?: Record<string, NoteVersion[]>
        currentNoteId?: unknown
      }
      const c = loose.currentNoteId
      const currentNoteId =
        c === null || c === undefined
          ? c
          : typeof c === 'string'
            ? c
            : undefined
      const refsRaw = (loose as { referencesByNoteId?: unknown })
        .referencesByNoteId
      const referencesByNoteId = isReferencesByNoteId(refsRaw) ? refsRaw : {}
      return {
        notes: loose.notes.map((n) =>
          normalizeNoteForApp(normalizePersistedNote(n))
        ),
        versionsByNoteId:
          typeof loose.versionsByNoteId === 'object' &&
          loose.versionsByNoteId !== null
            ? loose.versionsByNoteId
            : {},
        referencesByNoteId,
        ...(currentNoteId !== undefined ? { currentNoteId } : {}),
      }
    }
  } catch {
    return null
  }
  return null
}

import { create } from 'zustand'
import type {
  Note,
  NoteTemplateId,
  NoteVersion,
  Reference,
  SidebarTab,
} from '../types'
import { getTemplateHtml, type NoteTemplateOptions } from '../lib/templates'
import {
  normalizeNoteForApp,
  resolveCurrentNoteId,
} from '../lib/noteNormalization'
import { appendVersion } from '../lib/versionHistory'
import { findNoteIdByTitle } from '../lib/wikiLinks'

export function createEmptyNote(
  template: NoteTemplateId = 'blank',
  options?: NoteTemplateOptions
): Note {
  const now = new Date().toISOString()
  const { title, body, editorMode, folder, tags } = getTemplateHtml(
    template,
    options
  )
  return normalizeNoteForApp({
    id: crypto.randomUUID(),
    title,
    content: body,
    editorMode,
    tags,
    folder,
    createdAt: now,
    updatedAt: now,
  })
}

type AppState = {
  notes: Note[]
  currentNoteId: string | null
  referencesByNoteId: Record<string, Reference[]>
  activeSidebarTab: SidebarTab
  versionsByNoteId: Record<string, NoteVersion[]>
  addNote: (note?: Note) => void
  addNoteFromTemplate: (
    template: NoteTemplateId,
    options?: NoteTemplateOptions
  ) => void
  deleteNote: (id: string) => void
  setCurrentNoteId: (id: string | null) => void
  updateCurrentNoteContent: (content: string) => void
  updateCurrentNoteTitle: (title: string) => void
  updateCurrentNoteTags: (tags: string[]) => void
  updateCurrentNoteFolder: (folder: string) => void
  setActiveSidebarTab: (tab: SidebarTab) => void
  addReference: (noteId: string | null, reference: Reference) => void
  removeReference: (noteId: string | null, referenceId: string) => void
  pushVersionSnapshot: (
    noteId: string,
    previousContent: string,
    nextContent: string,
    snapshotTitle?: string
  ) => void
  addNoteFromTitle: (title: string) => void
  /** Ensure a note exists for this wiki title; does not change the active note. Returns null if title is empty/invalid. */
  ensureNoteForWikiTitle: (title: string) => string | null
  restoreNoteVersion: (noteId: string, versionId: string) => void
  importState: (
    notes: Note[],
    versionsByNoteId: Record<string, NoteVersion[]>,
    currentNoteId?: string | null,
    referencesByNoteId?: Record<string, Reference[]>
  ) => void
  resetAll: () => void
}

function patchCurrentNote(
  notes: Note[],
  currentNoteId: string | null,
  patch: Partial<Pick<Note, 'title' | 'content' | 'tags' | 'folder'>>
): Note[] {
  if (!currentNoteId) return notes
  const now = new Date().toISOString()
  return notes.map((n) =>
    n.id === currentNoteId ? { ...n, ...patch, updatedAt: now } : n
  )
}

export const useAppStore = create<AppState>((set, get) => ({
  notes: [],
  currentNoteId: null,
  referencesByNoteId: {},
  activeSidebarTab: 'literature',
  versionsByNoteId: {},

  addNote: (note) => {
    const raw = note ?? createEmptyNote('blank')
    const n = normalizeNoteForApp(raw)
    if (import.meta.env.DEV) {
      console.debug('[addNote] normalized payload', n)
    }
    set((s) => ({
      notes: [...s.notes, n],
      currentNoteId: n.id,
    }))
  },

  addNoteFromTemplate: (template, options) => {
    const n = createEmptyNote(template, options)
    get().addNote(n)
  },

  deleteNote: (id) =>
    set((s) => {
      const idx = s.notes.findIndex((n) => n.id === id)
      if (idx === -1) return s
      const nextNotes = s.notes.filter((n) => n.id !== id)
      let nextCurrent = s.currentNoteId
      if (s.currentNoteId === id) {
        if (nextNotes.length === 0) nextCurrent = null
        else
          nextCurrent = nextNotes[Math.min(idx, nextNotes.length - 1)]!.id
      }
      const restVersions = { ...s.versionsByNoteId }
      delete restVersions[id]
      return {
        notes: nextNotes,
        currentNoteId: nextCurrent,
        versionsByNoteId: restVersions,
      }
    }),

  setCurrentNoteId: (id) => set({ currentNoteId: id }),

  updateCurrentNoteContent: (content) =>
    set((s) => ({
      notes: patchCurrentNote(s.notes, s.currentNoteId, { content }),
    })),

  updateCurrentNoteTitle: (title) =>
    set((s) => ({
      notes: patchCurrentNote(s.notes, s.currentNoteId, { title }),
    })),

  updateCurrentNoteTags: (tags) =>
    set((s) => ({
      notes: patchCurrentNote(s.notes, s.currentNoteId, { tags }),
    })),

  updateCurrentNoteFolder: (folder) =>
    set((s) => ({
      notes: patchCurrentNote(s.notes, s.currentNoteId, { folder }),
    })),

  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),

  addReference: (noteId, reference) => {
    if (noteId == null) return
    set((s) => {
      const key = noteId
      const existing = s.referencesByNoteId[key] ?? []
      if (existing.some((r) => r.id === reference.id)) return s
      return {
        referencesByNoteId: {
          ...s.referencesByNoteId,
          [key]: [...existing, reference],
        },
      }
    })
  },

  removeReference: (noteId, referenceId) => {
    if (noteId == null) return
    set((s) => {
      const key = noteId
      const list = s.referencesByNoteId[key] ?? []
      const next = list.filter((r) => r.id !== referenceId)
      if (next.length === list.length) return s
      const nextMap = { ...s.referencesByNoteId }
      if (next.length === 0) delete nextMap[key]
      else nextMap[key] = next
      return { referencesByNoteId: nextMap }
    })
  },

  pushVersionSnapshot: (noteId, previousContent, nextContent, snapshotTitle) =>
    set((s) => {
      if (previousContent === nextContent) return s
      const existing = s.versionsByNoteId[noteId]
      const nextList = appendVersion(
        existing,
        nextContent,
        previousContent,
        snapshotTitle
      )
      return {
        versionsByNoteId: { ...s.versionsByNoteId, [noteId]: nextList },
      }
    }),

  addNoteFromTitle: (title) => {
    const trimmed = title.trim()
    const n = createEmptyNote('blank')
    const note = normalizeNoteForApp({
      ...n,
      title: trimmed.length > 0 ? trimmed : 'Untitled',
    })
    set((s) => ({
      notes: [...s.notes, note],
      currentNoteId: note.id,
    }))
  },

  ensureNoteForWikiTitle: (title) => {
    const trimmed = title.trim()
    if (!trimmed) return null
    const notes = get().notes
    const list = notes.map((n) => ({ id: n.id, title: n.title }))
    const existing = findNoteIdByTitle(list, trimmed)
    if (existing) return existing
    const n = createEmptyNote('blank')
    const note = normalizeNoteForApp({ ...n, title: trimmed })
    set((s) => ({ notes: [...s.notes, note] }))
    return note.id
  },

  restoreNoteVersion: (noteId, versionId) =>
    set((s) => {
      const versions = s.versionsByNoteId[noteId] ?? []
      const v = versions.find((x) => x.id === versionId)
      if (!v) return s
      const note = s.notes.find((n) => n.id === noteId)
      if (!note) return s
      if (note.content === v.content) return s

      const existing = s.versionsByNoteId[noteId]
      const nextList = appendVersion(
        existing,
        v.content,
        note.content,
        note.title
      )

      const now = new Date().toISOString()
      const notes = s.notes.map((n) =>
        n.id === noteId
          ? { ...n, content: v.content, updatedAt: now }
          : n
      )
      return {
        notes,
        versionsByNoteId: {
          ...s.versionsByNoteId,
          [noteId]: nextList,
        },
      }
    }),

  importState: (notes, versionsByNoteId, preferredCurrentId, referencesByNoteId) => {
    const normalized = notes.map((n) => normalizeNoteForApp(n))
    set({
      notes: normalized,
      versionsByNoteId,
      currentNoteId: resolveCurrentNoteId(normalized, preferredCurrentId),
      referencesByNoteId: referencesByNoteId ? { ...referencesByNoteId } : {},
    })
  },

  resetAll: () =>
    set({
      notes: [],
      currentNoteId: null,
      referencesByNoteId: {},
      versionsByNoteId: {},
    }),
}))

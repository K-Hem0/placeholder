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
import {
  latexMarkdownToHtml,
  looksLikeLatexOrMarkdown,
} from '../lib/latexToHtml'

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
  restoreNoteVersion: (noteId: string, versionId: string) => void | Promise<void>
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
  patch: Partial<
    Pick<Note, 'title' | 'content' | 'tags' | 'folder' | 'editorMode'>
  >
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
  activeSidebarTab: 'explore',
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
    set((s) => {
      const note =
        s.currentNoteId != null
          ? s.notes.find((n) => n.id === s.currentNoteId)
          : null
      const patch: Partial<Pick<Note, 'content' | 'editorMode'>> = {
        content,
      }
      if (note?.editorMode === 'latex') {
        patch.editorMode = 'rich'
      }
      return { notes: patchCurrentNote(s.notes, s.currentNoteId, patch) }
    }),

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

  restoreNoteVersion: async (noteId, versionId) => {
    const s = get()
    const versions = s.versionsByNoteId[noteId] ?? []
    const v = versions.find((x) => x.id === versionId)
    if (!v) return
    const note = s.notes.find((n) => n.id === noteId)
    if (!note) return
    if (note.content === v.content) return

    let restoredContent = v.content
    if (looksLikeLatexOrMarkdown(restoredContent)) {
      restoredContent = await latexMarkdownToHtml(restoredContent)
    }

    const existing = s.versionsByNoteId[noteId]
    const nextList = appendVersion(
      existing,
      v.content,
      note.content,
      note.title
    )
    const now = new Date().toISOString()
    set({
      notes: s.notes.map((n) =>
        n.id === noteId
          ? { ...n, content: restoredContent, editorMode: 'rich' as const, updatedAt: now }
          : n
      ),
      versionsByNoteId: {
        ...s.versionsByNoteId,
        [noteId]: nextList,
      },
    })
  },

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

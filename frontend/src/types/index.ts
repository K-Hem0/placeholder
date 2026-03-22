export type SidebarTab = 'literature' | 'tools' | 'history'

export type NoteVersion = {
  id: string
  createdAt: string
  /** Rich-text HTML or raw LaTeX, matching the parent note’s `editorMode` when recorded */
  content: string
  /** Note title when this snapshot was recorded (best-effort). */
  snapshotTitle?: string
}

/** How the main note body is edited and interpreted. */
export type EditorMode = 'rich' | 'latex'

export type Note = {
  id: string
  title: string
  content: string
  /** Rich-text HTML or raw LaTeX source, depending on `editorMode`. */
  tags: string[]
  /** Folder / collection label; empty string = inbox / uncategorized */
  folder: string
  /** Defaults to `rich` when missing (older persisted data). */
  editorMode?: EditorMode
  createdAt: string
  updatedAt: string
}

export type Reference = {
  id: string
  title: string
  authors: string[]
  year: number
  abstract: string
  url: string
  credibility: number
  /** From literature search when available */
  venue?: string
  citationCount?: number
}

export type NoteTemplateId =
  | 'blank'
  | 'daily-lecture'
  | 'research-paper'
  | 'blog-post'

export type NoteSort = 'updated' | 'created' | 'title'

export type EditorMaxWidth = 'narrow' | 'medium' | 'wide'

export type ThemePreference = 'light' | 'dark' | 'system'

/** UI tint applied on top of light/dark; persisted for experimentation. */
export type ColorSchemeId =
  | 'default'
  | 'slate'
  | 'graphite'
  | 'indigo'
  | 'forest'
  | 'rose'
  | 'wildwest'

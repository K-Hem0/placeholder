export type SidebarTab = 'literature' | 'tools' | 'backlinks' | 'history'

export type NoteVersion = {
  id: string
  createdAt: string
  /** TipTap HTML snapshot */
  content: string
  /** Note title when this snapshot was recorded (best-effort). */
  snapshotTitle?: string
}

export type Note = {
  id: string
  title: string
  content: string
  tags: string[]
  /** Folder / collection label; empty string = inbox / uncategorized */
  folder: string
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
}

export type NoteTemplateId =
  | 'blank'
  | 'daily-note'
  | 'lecture-notes'
  | 'literature'
  | 'research-log'
  | 'annotated-bibliography'
  | 'essay-outline'
  | 'reflection'
  | 'meeting-notes'
  | 'coding-notes'
  | 'bug-log'
  | 'math-proof'
  | 'latex-article'
  | 'latex-homework'
  | 'latex-proof'

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

/**
 * Extension points for future panels (Literature discovery, AI assistant).
 * Replace tab content in the right sidebar by implementing these contracts.
 */

/** Article or source row for the Literature panel (stub until wired to APIs). */
export type LiteratureItem = {
  id: string
  title: string
  authors: string
  year?: number
  url?: string
  snippet?: string
}

export type LiteraturePanelProps = {
  /** Current note id for context-aware queries (optional). */
  currentNoteId: string | null
  /** Selected text from editor when the user invokes “search selection”. */
  selectionSnippet?: string
  onInsertCitation?: (item: LiteratureItem) => void
}

/** AI / writing assistant surface (stub). */
export type WritingAssistantAction =
  | { type: 'suggest_next_paragraph' }
  | { type: 'rewrite_selection'; text: string }

export type WritingAssistantPanelProps = {
  currentNoteId: string | null
  onAction?: (action: WritingAssistantAction) => void
}

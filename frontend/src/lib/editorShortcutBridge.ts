import type { Editor } from '@tiptap/core'

let editor: Editor | null = null

/** Lets global shortcut handlers run TipTap commands (e.g. heading levels) without scattering listeners. */
export function registerEditorForShortcuts(next: Editor | null) {
  editor = next
}

export function getEditorForShortcuts(): Editor | null {
  return editor
}

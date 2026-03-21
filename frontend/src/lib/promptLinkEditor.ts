import type { Editor } from '@tiptap/core'

/** Prompt for a URL and apply or remove a link. Shared by toolbar and Mod+K. */
export function promptAndSetLink(editor: Editor): void {
  const prev = editor.getAttributes('link').href as string | undefined
  const next = window.prompt('Link URL', prev ?? 'https://')
  if (next === null) return
  const trimmed = next.trim()
  if (trimmed === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
}

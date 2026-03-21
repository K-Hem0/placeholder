import type { Editor } from '@tiptap/core'
import type { Range } from '@tiptap/core'

export type SlashMenuItem = {
  id: string
  label: string
  group: string
  keywords: string[]
  run: (editor: Editor, range: Range) => void
}

function clearBlockModes(editor: Editor) {
  let chain = editor.chain().focus()
  if (editor.isActive('bulletList')) chain = chain.toggleBulletList()
  if (editor.isActive('orderedList')) chain = chain.toggleOrderedList()
  if (editor.isActive('blockquote')) chain = chain.toggleBlockquote()
  if (editor.isActive('codeBlock')) chain = chain.toggleCodeBlock()
  chain.run()
}

export const SLASH_ITEMS: SlashMenuItem[] = [
  {
    id: 'paragraph',
    label: 'Text',
    group: 'Basic',
    keywords: ['paragraph', 'p', 'body'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).run()
      clearBlockModes(editor)
      editor.chain().focus().setParagraph().run()
    },
  },
  {
    id: 'h1',
    label: 'Heading 1',
    group: 'Basic',
    keywords: ['title', 'h1', 'heading'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).run()
      clearBlockModes(editor)
      editor.chain().focus().setHeading({ level: 1 }).run()
    },
  },
  {
    id: 'h2',
    label: 'Heading 2',
    group: 'Basic',
    keywords: ['subtitle', 'h2'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).run()
      clearBlockModes(editor)
      editor.chain().focus().setHeading({ level: 2 }).run()
    },
  },
  {
    id: 'h3',
    label: 'Heading 3',
    group: 'Basic',
    keywords: ['h3'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).run()
      clearBlockModes(editor)
      editor.chain().focus().setHeading({ level: 3 }).run()
    },
  },
  {
    id: 'bullet',
    label: 'Bullet List',
    group: 'Lists',
    keywords: ['ul', 'unordered', 'bullets'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    id: 'ordered',
    label: 'Numbered List',
    group: 'Lists',
    keywords: ['ol', 'ordered', 'numbers'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    id: 'quote',
    label: 'Quote',
    group: 'Blocks',
    keywords: ['blockquote', 'citation'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    id: 'code',
    label: 'Code Block',
    group: 'Blocks',
    keywords: ['code', 'pre', 'snippet'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    id: 'divider',
    label: 'Divider',
    group: 'Blocks',
    keywords: ['hr', 'horizontal', 'line', 'rule'],
    run: (editor, range) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
]

export function filterSlashItems(query: string): SlashMenuItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return SLASH_ITEMS
  return SLASH_ITEMS.filter(
    (i) =>
      i.label.toLowerCase().includes(q) ||
      i.keywords.some((k) => k.includes(q)) ||
      i.group.toLowerCase().includes(q)
  )
}

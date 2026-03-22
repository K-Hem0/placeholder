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
  ...([1, 2, 3] as const).map((level) => ({
    id: `h${level}` as const,
    label: `Heading ${level}`,
    group: 'Basic' as const,
    keywords: level === 1 ? ['title', 'h1', 'heading'] : level === 2 ? ['subtitle', 'h2'] : ['h3'],
    run: (editor: Editor, range: Range) => {
      editor.chain().focus().deleteRange(range).run()
      clearBlockModes(editor)
      editor.chain().focus().setMark('inlineHeading', { level }).run()
    },
  })),
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

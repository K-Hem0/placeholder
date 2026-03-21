import { InputRule, Mark, mergeAttributes } from '@tiptap/core'
import { useAppStore } from '../store'

/**
 * Wiki-style internal links: type [[Note title]] → rendered as a marked span.
 * Navigation is handled in the editor shell via click delegation (see EditorPane).
 */
export const WikiLink = Mark.create({
  name: 'wikiLink',
  inclusive: false,

  addAttributes() {
    return {
      title: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-wiki-link]',
        getAttrs: (el) => {
          if (!(el instanceof HTMLElement)) return false
          const title = el.getAttribute('data-wiki-title')?.trim() ?? ''
          return title ? { title } : false
        },
      },
    ]
  },

  renderHTML({ mark, HTMLAttributes }) {
    const title = String(mark.attrs.title ?? '')
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-wiki-link': '',
        'data-wiki-title': title,
        class:
          'wiki-link rounded-sm px-0.5 text-sky-800 underline decoration-sky-700/40 underline-offset-[3px] transition ' +
          'cursor-pointer hover:bg-sky-500/10 hover:decoration-sky-700/60 hover:text-sky-900 ' +
          'dark:text-sky-200/95 dark:decoration-sky-400/35 dark:hover:bg-sky-500/10 dark:hover:text-sky-50',
      }),
      0,
    ]
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\[\[([^\]]+)\]\]$/,
        handler: ({ range, match, chain }) => {
          const title = match[1]?.trim()
          if (!title) return null
          chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'text',
              text: title,
              marks: [{ type: this.name, attrs: { title } }],
            })
            .run()
          useAppStore.getState().ensureNoteForWikiTitle(title)
        },
      }),
    ]
  },
})

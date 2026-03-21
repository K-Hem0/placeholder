import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'
import { createRoot, type Root } from 'react-dom/client'
import tippy, { type Instance } from 'tippy.js'
import { WikiLinkMenu } from '../components/editor/WikiLinkMenu'
import { wikiLinkMenuKeyHandlerRef } from './wikiLinkMenuKeyHandler'
import { findWikiWikiMatch } from './findWikiWikiMatch'
import { useAppStore } from '../store'
import type { Note } from '../types'

export const wikiLinkSuggestionPluginKey = new PluginKey('wikiLinkSuggestion')

function filterNotesByQuery(query: string): Note[] {
  const notes = useAppStore.getState().notes
  const q = query.trim().toLowerCase()
  const sorted = [...notes].sort((a, b) =>
    (a.updatedAt < b.updatedAt ? 1 : -1)
  )
  if (!q) return sorted.slice(0, 12)
  return sorted
    .filter((n) => (n.title.trim() || 'Untitled').toLowerCase().includes(q))
    .slice(0, 12)
}

export const WikiLinkSuggestionExtension = Extension.create({
  name: 'wikiLinkSuggestion',

  addProseMirrorPlugins() {
    let root: Root | null = null
    let popup: Instance | null = null
    let container: HTMLDivElement | null = null

    return [
      Suggestion<Note, Note>({
        editor: this.editor,
        pluginKey: wikiLinkSuggestionPluginKey,
        char: '[',
        allowSpaces: true,
        findSuggestionMatch: findWikiWikiMatch,
        allow: ({ editor }) => !editor.isActive('codeBlock'),
        command: ({ editor, range, props }) => {
          const title = props.title.trim() || 'Untitled'
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: 'text',
              text: title,
              marks: [{ type: 'wikiLink', attrs: { title } }],
            })
            .run()
          useAppStore.getState().ensureNoteForWikiTitle(title)
        },
        items: ({ query }) => filterNotesByQuery(query),
        render: () => ({
          onStart: (props) => {
            container = document.createElement('div')
            root = createRoot(container)
            root.render(<WikiLinkMenu {...props} />)

            const rectOrFallback = () => {
              const r = props.clientRect?.()
              return r ?? new DOMRect(0, 0, 0, 0)
            }

            popup = tippy(document.body, {
              getReferenceClientRect: rectOrFallback,
              appendTo: () => document.body,
              content: container,
              interactive: true,
              trigger: 'manual',
              placement: 'bottom-start',
              showOnCreate: true,
              maxWidth: 320,
              animation: 'fade',
              offset: [0, 8],
              duration: [160, 120],
              moveTransition: 'transform 0.15s ease-out',
              theme: 'slash',
            })
          },
          onUpdate: (props) => {
            if (!root || !container) return
            root.render(<WikiLinkMenu {...props} />)
            popup?.setProps({
              getReferenceClientRect: () => {
                const r = props.clientRect?.()
                return r ?? new DOMRect(0, 0, 0, 0)
              },
            })
          },
          onKeyDown: (props) => {
            if (props.event.key === 'Escape') {
              return false
            }
            return wikiLinkMenuKeyHandlerRef.current?.(props.event) ?? false
          },
          onExit: () => {
            popup?.destroy()
            popup = null
            root?.unmount()
            root = null
            container = null
          },
        }),
      }),
    ]
  },
})

import { Extension } from '@tiptap/core'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion from '@tiptap/suggestion'
import { createRoot, type Root } from 'react-dom/client'
import tippy, { type Instance } from 'tippy.js'
import { SlashCommandMenu } from '../components/editor/SlashCommandMenu'
import { slashMenuKeyHandlerRef } from './slashMenuKeyHandler'
import type { SlashMenuItem } from './slashCommandItems'
import { filterSlashItems } from './slashCommandItems'

export const slashCommandPluginKey = new PluginKey('slashCommand')

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addProseMirrorPlugins() {
    let root: Root | null = null
    let popup: Instance | null = null
    let container: HTMLDivElement | null = null

    return [
      Suggestion<SlashMenuItem, SlashMenuItem>({
        editor: this.editor,
        pluginKey: slashCommandPluginKey,
        char: '/',
        allowSpaces: true,
        startOfLine: false,
        allow: ({ editor: ed }) => !ed.isActive('codeBlock'),
        command: ({ editor: ed, range, props }) => {
          props.run(ed, range)
        },
        items: ({ query }) => filterSlashItems(query),
        render: () => ({
          onStart: (props) => {
            container = document.createElement('div')
            root = createRoot(container)
            root.render(<SlashCommandMenu {...props} />)

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
              maxWidth: 360,
              animation: 'fade',
              offset: [0, 8],
              duration: [160, 120],
              moveTransition: 'transform 0.15s ease-out',
              theme: 'slash',
            })
          },
          onUpdate: (props) => {
            if (!root || !container) return
            root.render(<SlashCommandMenu {...props} />)
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
            return slashMenuKeyHandlerRef.current?.(props.event) ?? false
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

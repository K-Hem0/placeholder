import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { useSettingsStore } from '../store/useSettingsStore'

const lineFocusPluginKey = new PluginKey('lineFocus')

/**
 * Adds a ProseMirror decoration to the block containing the cursor (line-focus-active).
 * Uses the decoration system so the class persists across DOM updates.
 */
export const LineFocusExtension = Extension.create({
  name: 'lineFocus',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: lineFocusPluginKey,
        props: {
          decorations(state) {
            return lineFocusDecos(state)
          },
        },
      }),
    ]
  },
})

function lineFocusDecos(state: import('@tiptap/pm/state').EditorState): DecorationSet {
  if (!useSettingsStore.getState().lineFocus) return DecorationSet.empty
  const { from } = state.selection
  const $pos = state.doc.resolve(from)
  const depth = $pos.depth
  if (depth < 1) return DecorationSet.empty

  let blockFrom = 0
  let blockTo = 0
  for (let d = depth; d >= 1; d--) {
    const node = $pos.node(d)
    const name = node.type.name
    if (name === 'blockquote' || name === 'listItem') {
      blockFrom = $pos.before(d)
      blockTo = $pos.after(d)
      break
    }
    if (name === 'paragraph') {
      const parentName = d > 1 ? $pos.node(d - 1).type.name : 'doc'
      if (parentName === 'doc') {
        blockFrom = $pos.before(d)
        blockTo = $pos.after(d)
        break
      }
    }
  }

  if (blockFrom === 0 && blockTo === 0) return DecorationSet.empty
  const deco = Decoration.node(blockFrom, blockTo, { class: 'line-focus-active' })
  return DecorationSet.create(state.doc, [deco])
}

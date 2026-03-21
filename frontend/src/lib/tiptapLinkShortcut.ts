import { Extension } from '@tiptap/core'
import { promptAndSetLink } from './promptLinkEditor'

/** Mod+K to insert or edit a link (matches toolbar). */
export const LinkKeyboardShortcut = Extension.create({
  name: 'linkKeyboardShortcut',
  addKeyboardShortcuts() {
    return {
      'Mod-k': () => {
        promptAndSetLink(this.editor)
        return true
      },
    }
  },
})

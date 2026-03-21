import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyleKit } from '@tiptap/extension-text-style/text-style-kit'
import { WikiLink } from './wikiLinkExtension'
import { SlashCommandExtension } from './slashCommandExtension'
import { WikiLinkSuggestionExtension } from './wikiLinkSuggestionExtension'
import { LinkKeyboardShortcut } from './tiptapLinkShortcut'

export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class:
            'text-sky-700 underline decoration-sky-700/35 underline-offset-2 transition hover:text-sky-800 dark:text-sky-400/95 dark:decoration-sky-400/30',
        },
      },
    }),
    TextStyleKit.configure({
      backgroundColor: false,
      color: false,
      fontFamily: false,
      lineHeight: false,
      fontSize: {},
      textStyle: {},
    }),
    TextAlign.configure({
      types: ['heading', 'paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Placeholder.configure({
      placeholder: 'Start writing…',
    }),
    WikiLink,
    WikiLinkSuggestionExtension,
    SlashCommandExtension,
    LinkKeyboardShortcut,
  ]
}

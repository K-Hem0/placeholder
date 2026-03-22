import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { LineFocusExtension } from './lineFocusExtension'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyleKit } from '@tiptap/extension-text-style/text-style-kit'
import { Mathematics } from '@tiptap/extension-mathematics'
import { WikiLink } from './wikiLinkExtension'
import { SlashCommandExtension } from './slashCommandExtension'
import { WikiLinkSuggestionExtension } from './wikiLinkSuggestionExtension'
import { LinkKeyboardShortcut } from './tiptapLinkShortcut'
import { HashtagHeadingExtension } from './hashtagHeadingExtension'
import { InlineHeadingExtension } from './inlineHeadingExtension'
import { SimpleInlineMathInputRule } from './simpleInlineMathInputRule'
import { BlockMathInputRule } from './blockMathInputRule'

export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: false,
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
      types: ['paragraph'],
      alignments: ['left', 'center', 'right', 'justify'],
    }),
    Placeholder.configure({
      placeholder: 'Start writing…',
    }),
    Mathematics.configure({
      katexOptions: { throwOnError: false, strict: 'ignore' },
    }),
    BlockMathInputRule,
    SimpleInlineMathInputRule,
    InlineHeadingExtension,
    HashtagHeadingExtension,
    WikiLink,
    WikiLinkSuggestionExtension,
    SlashCommandExtension,
    LinkKeyboardShortcut,
    LineFocusExtension,
  ]
}

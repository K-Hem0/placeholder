import StarterKit from '@tiptap/starter-kit'
import CodeBlock from '@tiptap/extension-code-block'
import { createLowlight, common } from 'lowlight'
import { createCodeBlockLowlightFixedExtension } from './codeBlockLowlightFixed'

const lowlight = createLowlight(common)
lowlight.registerAlias({
  javascript: ['js', 'jsx', 'mjs', 'cjs'],
  typescript: ['ts', 'tsx'],
  python: ['py', 'py3'],
  yaml: ['yml'],
  graphql: ['gql'],
  markdown: ['md'],
  shell: ['sh', 'bash', 'zsh'],
  xml: ['html', 'xhtml', 'svg'],
})
import TextAlign from '@tiptap/extension-text-align'
import { LineFocusExtension } from './lineFocusExtension'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyleKit } from '@tiptap/extension-text-style/text-style-kit'
import { Mathematics } from '@tiptap/extension-mathematics'
import { SlashCommandExtension } from './slashCommandExtension'
import { LinkKeyboardShortcut } from './tiptapLinkShortcut'
import { HashtagHeadingExtension } from './hashtagHeadingExtension'
import { InlineHeadingExtension } from './inlineHeadingExtension'
import { SimpleInlineMathInputRule } from './simpleInlineMathInputRule'
import { BlockMathInputRule } from './blockMathInputRule'

export function createEditorExtensions() {
  return [
    StarterKit.configure({
      heading: false,
      codeBlock: false,
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class:
            'text-sky-700 underline decoration-sky-700/35 underline-offset-2 transition hover:text-sky-800 dark:text-sky-400/95 dark:decoration-sky-400/30',
        },
      },
    }),
    CodeBlock.configure({
      defaultLanguage: null,
      enableTabIndentation: true,
      HTMLAttributes: {
        class: 'hljs',
      },
    }),
    createCodeBlockLowlightFixedExtension({ lowlight, defaultLanguage: null }),
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
    SlashCommandExtension,
    LinkKeyboardShortcut,
    LineFocusExtension,
  ]
}

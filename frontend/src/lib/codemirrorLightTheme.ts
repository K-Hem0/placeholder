import { EditorView } from '@codemirror/view'

/**
 * Light, app-aligned CodeMirror 6 theme — soft neutrals, no harsh black panels.
 * Pairs with `oneDark` for dark mode.
 */
export const codemirrorLightTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'rgb(250 250 249)', /* stone-50 */
      color: 'rgb(51 65 85)', /* slate-700 */
    },
    '.cm-scroller': {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    '.cm-content': {
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      caretColor: 'rgb(30 41 59)', /* slate-800 */
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: 'rgb(30 41 59)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      background: 'rgb(186 230 253 / 0.35)', /* sky-200 tint */
    },
    '.cm-gutters': {
      backgroundColor: 'rgb(244 244 245)', /* zinc-100 */
      color: 'rgb(161 161 170)', /* zinc-400 */
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgb(228 228 231)', /* zinc-200 */
    },
    '.cm-activeLine': {
      backgroundColor: 'rgb(241 245 249 / 0.65)', /* slate-100 */
    },
    '.cm-foldPlaceholder': {
      backgroundColor: 'rgb(241 245 249)',
      border: '1px solid rgb(226 232 240)',
      color: 'rgb(100 116 139)',
    },
    '.cm-panels': {
      backgroundColor: 'rgb(250 250 249)',
      color: 'rgb(51 65 85)',
    },
    '.cm-panels.cm-panels-top': {
      borderBottom: '1px solid rgb(228 231 236)',
    },
    '.cm-searchMatch': {
      backgroundColor: 'rgb(254 249 195 / 0.65)',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: 'rgb(253 230 138 / 0.75)',
    },
    '.cm-matchingBracket': {
      backgroundColor: 'rgb(224 242 254 / 0.7)',
      outline: '1px solid rgb(125 211 252 / 0.45)',
    },
  }
)

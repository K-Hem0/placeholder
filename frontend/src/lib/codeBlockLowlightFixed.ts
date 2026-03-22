import { Extension } from '@tiptap/core'
import { findChildren } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

type LowlightInstance = {
  highlight: (lang: string, code: string) => unknown
  highlightAuto: (code: string) => unknown
  listLanguages: () => string[]
  registered?: (lang: string) => boolean
}

/**
 * Lowlight plugin that ALWAYS recalculates decorations when the document
 * changes and contains code blocks. Fixes colors disappearing when adding code.
 */
function createLowlightPlugin(options: {
  name: string
  lowlight: LowlightInstance
  defaultLanguage: string | null
}) {
  const { name, lowlight, defaultLanguage } = options

  type HastNode = { children?: HastNode[]; value?: string; properties?: { className?: string[] } }

  function getHighlightNodes(result: unknown): HastNode[] {
    const r = result as { value?: HastNode[]; children?: HastNode[] }
    const arr = r?.value ?? r?.children ?? []
    return Array.isArray(arr) ? arr : []
  }

  function parseNodes(nodes: HastNode[], className: string[] = []): Array<{ text: string; classes: string[] }> {
    return nodes.flatMap((node) => {
      const classes = [...className, ...(node.properties?.className ?? [])]
      if (node.children?.length) {
        return parseNodes(node.children, classes)
      }
      const text = node.value ?? ''
      return [{ text: String(text), classes }]
    })
  }

  function getDecorations(doc: import('@tiptap/pm/model').Node) {
    const decorations: ReturnType<typeof Decoration.inline>[] = []
    findChildren(doc, (node) => node.type.name === name).forEach((block) => {
      let from = block.pos + 1
      const language = block.node.attrs.language ?? defaultLanguage
      const languages = lowlight.listLanguages()
      const isRegistered = (lang: string) =>
        Boolean(languages.includes(lang) || lowlight.registered?.(lang))

      let nodes: Array<{ text: string; classes: string[] }> = []
      try {
        const result =
          language && isRegistered(language)
            ? lowlight.highlight(language, block.node.textContent)
            : lowlight.highlightAuto(block.node.textContent)
        const rawNodes = getHighlightNodes(result)
        nodes = parseNodes(rawNodes)
      } catch {
        // Fallback: no highlighting on error
      }

      nodes.forEach((node) => {
        const to = from + node.text.length
        if (node.classes.length) {
          decorations.push(Decoration.inline(from, to, { class: node.classes.join(' ') }))
        }
        from = to
      })
    })
    return DecorationSet.create(doc, decorations)
  }

  return new Plugin({
    key: new PluginKey('lowlight'),
    state: {
      init(_, { doc }) {
        return getDecorations(doc)
      },
      apply(transaction, decorationSet, _oldState, newState) {
        if (!transaction.docChanged) {
          return decorationSet.map(transaction.mapping, newState.doc)
        }
        const hasCodeBlocks = findChildren(newState.doc, (node) => node.type.name === name).length > 0
        if (hasCodeBlocks) {
          return getDecorations(newState.doc)
        }
        return decorationSet.map(transaction.mapping, newState.doc)
      },
    },
    props: {
      decorations(state) {
        return (this as Plugin).getState(state)
      },
    },
  })
}

/**
 * Extension that adds syntax highlighting to code blocks with reliable
 * decoration updates - recalculates whenever doc changes.
 */
export function createCodeBlockLowlightFixedExtension(options: {
  lowlight: LowlightInstance
  defaultLanguage?: string | null
}) {
  return Extension.create({
    name: 'codeBlockLowlightFixed',
    addProseMirrorPlugins() {
      return [
        createLowlightPlugin({
          name: 'codeBlock',
          lowlight: options.lowlight,
          defaultLanguage: options.defaultLanguage ?? null,
        }),
      ]
    },
  })
}

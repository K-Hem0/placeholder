import type { ResolvedPos } from '@tiptap/pm/model'

type SuggestionMatch = {
  range: { from: number; to: number }
  query: string
  text: string
} | null

/**
 * Match `[[query` … cursor — replaces default @tiptap/suggestion matcher for wiki links.
 */
export function findWikiWikiMatch(args: {
  char: string
  allowSpaces: boolean
  allowToIncludeChar: boolean
  allowedPrefixes: string[] | null
  startOfLine: boolean
  $position: ResolvedPos
}): SuggestionMatch {
  void args.char
  const $from = args.$position
  const parent = $from.parent
  if (!parent.isTextblock) return null

  const blockStart = $from.start()
  const beforeCursor = $from.pos - blockStart
  const textBefore = parent.textBetween(0, beforeCursor, '\0', '\0')

  const openIdx = textBefore.lastIndexOf('[[')
  if (openIdx === -1) return null

  const afterOpen = textBefore.slice(openIdx + 2)
  if (afterOpen.includes(']]')) return null
  if (afterOpen.includes('\n')) return null

  const query = args.allowSpaces ? afterOpen : afterOpen.replace(/\s.*$/, '')

  const from = blockStart + openIdx
  const to = $from.pos
  const text = textBefore.slice(openIdx)

  return {
    range: { from, to },
    query,
    text,
  }
}

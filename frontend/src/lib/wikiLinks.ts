/**
 * Parse wiki-style links from stored HTML and plain [[title]] fragments.
 * Used for backlinks and resolving navigation targets.
 */

import { htmlToPlainText } from './htmlPlain'

const WIKI_ATTR = /data-wiki-title="([^"]+)"/gi
const WIKI_BRACKET = /\[\[([^\]]+)\]\]/g

/** Extract `[[title]]` and `data-wiki-title` targets from note HTML. */
export function extractWikiTitlesFromHtml(html: string): string[] {
  const out = new Set<string>()
  let m: RegExpExecArray | null
  const reAttr = new RegExp(WIKI_ATTR.source, WIKI_ATTR.flags)
  while ((m = reAttr.exec(html)) !== null) {
    const t = m[1]?.trim()
    if (t) out.add(t)
  }
  const reBr = new RegExp(WIKI_BRACKET.source, WIKI_BRACKET.flags)
  while ((m = reBr.exec(html)) !== null) {
    const t = m[1]?.trim()
    if (t) out.add(t)
  }
  return [...out]
}

export function normalizeTitleKey(title: string): string {
  return title.trim().toLowerCase()
}

export function findNoteIdByTitle(
  notes: { id: string; title: string }[],
  targetTitle: string
): string | null {
  const key = normalizeTitleKey(targetTitle)
  if (!key) return null
  const exact = notes.find((n) => normalizeTitleKey(n.title) === key)
  return exact?.id ?? null
}

export function computeBacklinks(
  notes: { id: string; title: string; content: string }[],
  currentNoteId: string
): { id: string; title: string }[] {
  const current = notes.find((n) => n.id === currentNoteId)
  if (!current) return []
  const titleKey = normalizeTitleKey(current.title)
  if (!titleKey) return []
  const results: { id: string; title: string }[] = []
  for (const n of notes) {
    if (n.id === currentNoteId) continue
    const titles = extractWikiTitlesFromHtml(n.content)
    const linksHere = titles.some((t) => normalizeTitleKey(t) === titleKey)
    if (linksHere) results.push({ id: n.id, title: n.title })
  }
  return results
}

export type BacklinkEntry = {
  id: string
  title: string
  snippet: string
}

/** Snippet around a reference to the current note’s title (plain text, best-effort). */
export function snippetAroundLinkToTitle(
  sourceHtml: string,
  targetTitle: string,
  radius = 56
): string {
  const plain = htmlToPlainText(sourceHtml)
  const needle = targetTitle.trim()
  if (!needle) return plain.slice(0, 140) + (plain.length > 140 ? '…' : '')

  const lower = plain.toLowerCase()
  const idx = lower.indexOf(needle.toLowerCase())
  if (idx === -1) {
    const short = plain.replace(/\s+/g, ' ').trim()
    return short.slice(0, 140) + (short.length > 140 ? '…' : '')
  }

  const start = Math.max(0, idx - radius)
  const end = Math.min(plain.length, idx + needle.length + radius)
  let s = plain.slice(start, end).replace(/\s+/g, ' ').trim()
  if (start > 0) s = '…' + s
  if (end < plain.length) s = s + '…'
  return s
}

export function computeBacklinksWithSnippets(
  notes: { id: string; title: string; content: string }[],
  currentNoteId: string
): BacklinkEntry[] {
  const base = computeBacklinks(notes, currentNoteId)
  const current = notes.find((n) => n.id === currentNoteId)
  if (!current) return []
  return base.map((b) => {
    const n = notes.find((x) => x.id === b.id)
    const snippet = n
      ? snippetAroundLinkToTitle(n.content, current.title)
      : ''
    return { ...b, snippet }
  })
}

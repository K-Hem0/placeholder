import type { EditorMode, Note } from '../types'

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

/** Legacy: LaTeX was stored as a single TipTap code block. */
function tryExtractLegacyLatexCodeBlock(html: string): string | null {
  const trimmed = html.trim()
  const m = trimmed.match(
    /^<pre><code[^>]*class="[^"]*language-latex[^"]*"[^>]*>([\s\S]*)<\/code><\/pre>$/i
  )
  if (m) return decodeHtmlEntities(m[1] ?? '')
  const m2 = trimmed.match(/^<pre><code[^>]*>([\s\S]*)<\/code><\/pre>$/i)
  if (m2 && /language-latex/i.test(trimmed)) {
    return decodeHtmlEntities(m2[1] ?? '')
  }
  return null
}

/**
 * Ensure `editorMode` is set and migrate older LaTeX-in-HTML notes to plain `.tex` in `content`.
 */
export function normalizePersistedNote(note: Note): Note {
  const explicit: EditorMode | undefined = note.editorMode
  if (explicit === 'latex') {
    return { ...note, editorMode: 'latex' }
  }
  if (explicit === 'rich') {
    return { ...note, editorMode: 'rich' }
  }
  const legacyTex = tryExtractLegacyLatexCodeBlock(note.content)
  if (legacyTex) {
    return {
      ...note,
      editorMode: 'latex',
      content: legacyTex,
    }
  }
  return { ...note, editorMode: 'rich' }
}

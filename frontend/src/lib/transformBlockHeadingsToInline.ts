/**
 * Strips wiki link spans to plain text (legacy content after link feature removal).
 */
export function stripWikiLinks(html: string): string {
  return html.replace(
    /<span[^>]*data-wiki-link[^>]*>([\s\S]*?)<\/span>/gi,
    (_, inner) => inner
  )
}

/**
 * Converts block headings (h1–h6) to inline span.heading for Notion-style flow.
 * Use when loading content into the editor so legacy h1/h2/h3 parse correctly.
 */
export function transformBlockHeadingsToInline(html: string): string {
  return html.replace(
    /<h([1-6])[^>]*>([\s\S]*?)<\/h[1-6]>/gi,
    (_, level, inner) => {
      const l = Math.min(parseInt(level, 10), 3) as 1 | 2 | 3
      return `<p><span class="heading heading-${l}" data-inline-heading="${l}">${inner}</span></p>`
    }
  )
}

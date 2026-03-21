/** Strip HTML to readable plain text for previews and diff (browser). */
export function htmlToPlainText(html: string): string {
  if (typeof document === 'undefined') {
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  const d = document.createElement('div')
  d.innerHTML = html
  return (d.textContent || '').replace(/\s+/g, ' ').trim()
}

export type LineDiffRow = { kind: 'same' | 'add' | 'rem'; text: string }

/** Simple line-level diff for short previews (readable, not a full Myers diff). */
export function diffPlainLines(a: string, b: string): LineDiffRow[] {
  const la = a.split(/\n/).map((s) => s.trim())
  const lb = b.split(/\n/).map((s) => s.trim())
  const rows: LineDiffRow[] = []
  const max = Math.max(la.length, lb.length)
  for (let i = 0; i < max; i++) {
    const x = la[i] ?? ''
    const y = lb[i] ?? ''
    if (x === y) {
      if (x !== '') rows.push({ kind: 'same', text: x })
    } else {
      if (x !== '') rows.push({ kind: 'rem', text: x })
      if (y !== '') rows.push({ kind: 'add', text: y })
    }
  }
  return rows.slice(0, 80)
}

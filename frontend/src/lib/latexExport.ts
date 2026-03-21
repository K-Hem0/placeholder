/** Safe filename stem for `.tex` downloads. */
export function sanitizeTexBasename(title: string): string {
  const base = title.trim() || 'document'
  const cleaned = base.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_').trim()
  return cleaned.length > 0 ? cleaned.slice(0, 120) : 'document'
}

export function downloadTexFile(title: string, source: string): void {
  const blob = new Blob([source], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  const url = URL.createObjectURL(blob)
  a.href = url
  a.download = `${sanitizeTexBasename(title)}.tex`
  a.click()
  URL.revokeObjectURL(url)
}

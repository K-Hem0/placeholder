import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import renderMathInElement from 'katex/contrib/auto-render'

type LatexMathPreviewProps = {
  source: string
  className?: string
}

/**
 * Renders the full source with KaTeX auto-render for `$…$`, `$$…$$`, `\(…\)`, `\[…\]`.
 * Full-document PDF preview is not implemented; this focuses on math and readable structure.
 */
export function LatexMathPreview({ source, className }: LatexMathPreviewProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.textContent = source
    try {
      renderMathInElement(el, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true },
        ],
        throwOnError: false,
        strict: 'ignore',
      })
    } catch {
      /* KaTeX may throw on unusual input; keep source visible */
    }
  }, [source])

  return (
    <div
      ref={ref}
      className={cn(
        'latex-math-preview whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-slate-700',
        'dark:text-slate-300/95',
        className
      )}
    />
  )
}

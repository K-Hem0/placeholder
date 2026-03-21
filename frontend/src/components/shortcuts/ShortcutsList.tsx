import { getShortcutDefinitions } from '../../lib/shortcutDefinitions'
import { cn } from '../../lib/cn'

export function ShortcutsList({ className }: { className?: string }) {
  const rows = getShortcutDefinitions()
  return (
    <ul
      className={cn('space-y-2.5', className)}
      aria-label="Keyboard shortcuts"
    >
      {rows.map((row) => (
        <li
          key={row.id}
          className="flex items-start justify-between gap-6 text-[13px] leading-snug"
        >
          <span className="min-w-0 text-slate-700 dark:text-slate-400/95">
            {row.action}
          </span>
          <span
            className={cn(
              'shrink-0 max-w-[min(14rem,48vw)] text-right font-mono text-[11px] leading-relaxed',
              'text-slate-600 dark:text-slate-500/90'
            )}
          >
            {row.keysLabel}
          </span>
        </li>
      ))}
    </ul>
  )
}

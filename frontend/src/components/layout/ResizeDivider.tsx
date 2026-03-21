import { cn } from '../../lib/cn'
import { DIVIDER_WIDTH_PX } from '../../lib/paneLayout'

type ResizeDividerProps = {
  /** Which split this handle controls (for a11y). */
  label: string
  active: boolean
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => void
  onDoubleClick?: () => void
}

export function ResizeDivider({
  label,
  active,
  onPointerDown,
  onDoubleClick,
}: ResizeDividerProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      style={{ width: DIVIDER_WIDTH_PX }}
      className={cn(
        'group relative z-20 flex h-full shrink-0 cursor-col-resize touch-none select-none',
        'border-0 bg-transparent p-0 outline-none',
        'focus-visible:ring-2 focus-visible:ring-sky-500/25 focus-visible:ring-offset-0',
        'dark:focus-visible:ring-sky-400/20'
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2',
          'bg-slate-200/55 transition-colors dark:bg-white/[0.08]',
          'group-hover:bg-slate-300/90 dark:group-hover:bg-white/[0.14]',
          active && 'bg-sky-400/80 dark:bg-sky-500/50'
        )}
        aria-hidden
      />
    </button>
  )
}

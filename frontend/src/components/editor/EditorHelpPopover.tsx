import { useCallback, useId, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { useUiStore } from '../../store/useUiStore'
import { ShortcutsList } from '../shortcuts/ShortcutsList'

type EditorHelpPopoverProps = {
  /** Smaller trigger for dense surfaces (e.g. template picker header). */
  variant?: 'default' | 'compact' | 'rail'
}

export function EditorHelpPopover({ variant = 'default' }: EditorHelpPopoverProps) {
  const open = useUiStore((s) => s.helpOpen)
  const setOpen = useUiStore((s) => s.setHelpOpen)
  const titleId = useId()
  const dialogId = useId()

  const close = useCallback(() => setOpen(false), [setOpen])

  const triggerClass =
    variant === 'rail'
      ? cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition',
          'hover:bg-slate-200/65 hover:text-slate-800',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
          'dark:text-slate-500 dark:hover:bg-white/[0.07] dark:hover:text-slate-200',
          'dark:focus-visible:ring-sky-400/20',
          open &&
            'bg-slate-200/60 text-slate-800 dark:bg-white/[0.08] dark:text-slate-200'
        )
      : cn(
          'flex shrink-0 items-center justify-center rounded-md font-medium text-slate-500 transition-colors duration-100',
          variant === 'compact' ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-[12px]',
          'hover:bg-slate-200/45 hover:text-slate-800',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/30',
          'dark:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-300',
          open && 'bg-slate-200/50 text-slate-800 dark:bg-white/[0.08] dark:text-slate-200'
        )

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? dialogId : undefined}
        title="Help & keyboard shortcuts"
        className={triggerClass}
      >
        {variant === 'rail' ? (
          <HelpCircleGlyph className="h-[17px] w-[17px]" />
        ) : (
          <span aria-hidden className="select-none">
            ?
          </span>
        )}
        <span className="sr-only">Help and keyboard shortcuts</span>
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto px-4 py-16 sm:py-20">
              <button
                type="button"
                aria-label="Close help"
                className="fixed inset-0 cursor-default bg-slate-950/20 backdrop-blur-[1px] dark:bg-black/45"
                onClick={close}
              />
              <div
                id={dialogId}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                  'relative z-10 my-auto w-full max-w-md rounded-2xl border border-slate-200/60',
                  'bg-[#fbfaf7] p-5 shadow-[0_24px_80px_-20px_rgba(15,23,42,0.2)]',
                  'dark:border-white/[0.07] dark:bg-[#15161d]',
                  'dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]'
                )}
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <h2
                    id={titleId}
                    className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100"
                  >
                    Help & shortcuts
                  </h2>
                  <button
                    type="button"
                    onClick={close}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-[12px] text-slate-500',
                      'hover:bg-slate-200/60 hover:text-slate-800',
                      'dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
                    )}
                  >
                    Close
                  </button>
                </div>

                <div className="max-h-[min(65dvh,520px)] space-y-6 overflow-y-auto pr-1 text-[13px] leading-relaxed text-slate-700 dark:text-slate-400/95">
                  <HelpBlock title="Internal links">
                    <p>
                      Type{' '}
                      <kbd className="rounded border border-slate-200/80 bg-slate-100/80 px-1.5 py-0.5 font-mono text-[12px] text-slate-800 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-slate-300">
                        [[note name]]
                      </kbd>{' '}
                      to link to another note by title.
                    </p>
                  </HelpBlock>
                  <HelpBlock title="Slash commands">
                    <p>
                      Type{' '}
                      <kbd className="rounded border border-slate-200/80 bg-slate-100/80 px-1.5 py-0.5 font-mono text-[12px] text-slate-800 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-slate-300">
                        /
                      </kbd>{' '}
                      to open the block and format menu.
                    </p>
                  </HelpBlock>
                  <HelpBlock title="Templates">
                    <p>
                      Use the chevron next to <strong>New note</strong> in the
                      notes panel to start from a structured template, or use the
                      shortcut in the list below.
                    </p>
                  </HelpBlock>

                  <section>
                    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-600/90">
                      Keyboard shortcuts
                    </h3>
                    <ShortcutsList />
                  </section>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  )
}

function HelpBlock({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section>
      <h3 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-600/90">
        {title}
      </h3>
      <div className="text-slate-700 dark:text-slate-400/95">{children}</div>
    </section>
  )
}

function HelpCircleGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  )
}

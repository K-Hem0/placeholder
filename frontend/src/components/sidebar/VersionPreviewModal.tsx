import { useEffect, useId, useMemo } from 'react'
import type { NoteVersion } from '../../types'
import { cn } from '../../lib/cn'
import { diffPlainLines, htmlToPlainText } from '../../lib/htmlPlain'

function formatWhen(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const previewBodyClass =
  'notes-editor-preview max-w-none px-3 py-3 text-[14px] leading-[1.65] text-slate-800 dark:text-slate-300/95 ' +
  '[&_p]:my-3 [&_p:first-child]:mt-0 ' +
  '[&_ul]:my-3 [&_ol]:my-3 [&_li]:marker:text-slate-500 ' +
  '[&_h1]:mb-2 [&_h1]:mt-6 [&_h1]:text-[1.35rem] [&_h1]:font-semibold [&_h1]:first:mt-0 ' +
  '[&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:first:mt-0 ' +
  '[&_h3]:mb-1.5 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:first:mt-0 ' +
  '[&_blockquote]:border-l-2 [&_blockquote]:border-slate-300/80 [&_blockquote]:pl-3 [&_blockquote]:text-slate-700 dark:[&_blockquote]:border-white/[0.12] ' +
  '[&_code]:rounded [&_code]:bg-slate-200/55 [&_code]:px-1 [&_code]:py-px [&_code]:text-[0.9em] dark:[&_code]:bg-white/[0.08] ' +
  '[&_pre]:rounded-md [&_pre]:border [&_pre]:border-slate-200/70 [&_pre]:bg-slate-100/80 [&_pre]:p-3 [&_pre]:text-[13px] dark:[&_pre]:border-white/[0.06] dark:[&_pre]:bg-[#12131a]'

type VersionPreviewModalProps = {
  open: boolean
  onClose: () => void
  version: NoteVersion | null
  currentContentHtml: string
  currentTitle: string
  onConfirmRestore: (versionId: string) => void
}

export function VersionPreviewModal({
  open,
  onClose,
  version,
  currentContentHtml,
  currentTitle,
  onConfirmRestore,
}: VersionPreviewModalProps) {
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const plainCurrent = useMemo(
    () => htmlToPlainText(currentContentHtml),
    [currentContentHtml]
  )
  const plainVersion = useMemo(
    () => (version ? htmlToPlainText(version.content) : ''),
    [version]
  )

  const lineDiff = useMemo(
    () => diffPlainLines(plainCurrent, plainVersion),
    [plainCurrent, plainVersion]
  )

  if (!open || !version) return null

  const versionTitle =
    version.snapshotTitle?.trim() ||
    currentTitle.trim() ||
    'Untitled'

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px] dark:bg-black/55"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          'relative z-[101] flex max-h-[min(92vh,880px)] w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border',
          'border-slate-200/80 bg-[var(--app-main)] shadow-2xl shadow-slate-900/10',
          'dark:border-white/[0.08] dark:shadow-black/40'
        )}
      >
        <header className="shrink-0 border-b border-slate-200/50 px-5 py-4 dark:border-white/[0.06]">
          <h2 id={titleId} className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
            Preview version
          </h2>
          <p id={descId} className="mt-1 text-[12px] leading-relaxed text-slate-500 dark:text-slate-500/90">
            {formatWhen(version.createdAt)}
            <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
            Title then: <span className="font-medium text-slate-700 dark:text-slate-300">{versionTitle}</span>
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-0 border-b border-slate-200/40 dark:border-white/[0.06] md:grid-cols-2">
            <div className="border-b border-slate-200/40 dark:border-white/[0.06] md:border-b-0 md:border-r">
              <div className="bg-slate-100/50 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500 dark:bg-white/[0.03] dark:text-slate-500/90">
                Current
              </div>
              <div
                className={cn(previewBodyClass, 'max-h-[min(38vh,320px)] overflow-y-auto')}
                dangerouslySetInnerHTML={{ __html: currentContentHtml || '<p></p>' }}
              />
            </div>
            <div>
              <div className="bg-sky-50/60 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.08em] text-sky-800/90 dark:bg-sky-950/25 dark:text-sky-300/90">
                This version
              </div>
              <div
                className={cn(previewBodyClass, 'max-h-[min(38vh,320px)] overflow-y-auto')}
                dangerouslySetInnerHTML={{ __html: version.content || '<p></p>' }}
              />
            </div>
          </div>

          {lineDiff.length > 0 ? (
            <div className="border-b border-slate-200/40 px-5 py-3 dark:border-white/[0.06]">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500/90">
                Text changes (plain)
              </p>
              <div className="max-h-[min(22vh,200px)] space-y-0.5 overflow-y-auto rounded-lg border border-slate-200/50 bg-slate-50/50 p-2 font-mono text-[11px] leading-snug dark:border-white/[0.06] dark:bg-black/20">
                {lineDiff.map((row, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded px-1.5 py-0.5',
                      row.kind === 'same' && 'text-slate-600 dark:text-slate-400',
                      row.kind === 'add' &&
                        'bg-emerald-100/80 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200/95',
                      row.kind === 'rem' &&
                        'bg-rose-100/70 text-rose-900 dark:bg-rose-950/35 dark:text-rose-200/95'
                    )}
                  >
                    {row.kind === 'add' ? '+ ' : row.kind === 'rem' ? '− ' : '  '}
                    {row.text || ' '}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-slate-200/50 px-5 py-3 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'rounded-lg px-3 py-2 text-[13px] font-medium text-slate-600 transition',
              'hover:bg-slate-200/60 hover:text-slate-900',
              'dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-100',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25 dark:focus-visible:ring-sky-400/20'
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirmRestore(version.id)}
            className={cn(
              'rounded-lg px-3 py-2 text-[13px] font-medium text-white transition',
              'bg-sky-600 hover:bg-sky-700',
              'dark:bg-sky-600/90 dark:hover:bg-sky-500',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40'
            )}
          >
            Restore this version
          </button>
        </footer>
      </div>
    </div>
  )
}

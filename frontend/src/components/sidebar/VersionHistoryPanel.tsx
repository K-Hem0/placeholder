import { useMemo, useState } from 'react'
import { useAppStore } from '../../store'
import type { NoteVersion } from '../../types'
import { cn } from '../../lib/cn'
import { VersionPreviewModal } from './VersionPreviewModal'

function formatWhen(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function VersionHistoryPanel() {
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const notes = useAppStore((s) => s.notes)
  const versionsByNoteId = useAppStore((s) => s.versionsByNoteId)
  const restoreNoteVersion = useAppStore((s) => s.restoreNoteVersion)

  const [previewVersion, setPreviewVersion] = useState<NoteVersion | null>(null)

  const currentNote = useMemo(() => {
    if (!currentNoteId) return null
    return notes.find((n) => n.id === currentNoteId) ?? null
  }, [currentNoteId, notes])

  const versions = useMemo(() => {
    if (!currentNoteId) return []
    const list = versionsByNoteId[currentNoteId] ?? []
    return [...list].reverse()
  }, [currentNoteId, versionsByNoteId])

  if (!currentNoteId) {
    return (
      <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-600/90">
        Open a note to browse versions.
      </p>
    )
  }

  if (versions.length === 0) {
    return (
      <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-600/90">
        Snapshots are created when you pause (~15s), switch notes, leave the window, or
        every few minutes while editing—only when changes are substantial enough to matter.
      </p>
    )
  }

  return (
    <>
      <ul className="max-h-[min(50dvh,360px)] space-y-1 overflow-y-auto pr-0.5" role="list">
        {versions.map((v) => (
          <li
            key={v.id}
            className="rounded-lg border border-slate-200/40 bg-white/30 p-2 dark:border-white/[0.05] dark:bg-white/[0.02]"
          >
            <div className="text-[11px] text-slate-500 dark:text-slate-600/90">
              {formatWhen(v.createdAt)}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPreviewVersion(v)}
                className={cn(
                  'rounded-md px-2 py-1 text-[12px] font-medium text-slate-700 transition',
                  'hover:bg-slate-200/50 dark:text-slate-300/95 dark:hover:bg-white/[0.05]'
                )}
              >
                Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewVersion(v)}
                className={cn(
                  'rounded-md px-2 py-1 text-[12px] font-medium text-sky-700 transition',
                  'hover:bg-sky-500/10 dark:text-sky-400/90 dark:hover:bg-sky-500/10'
                )}
              >
                Review & restore
              </button>
            </div>
          </li>
        ))}
      </ul>

      <VersionPreviewModal
        open={previewVersion != null}
        onClose={() => setPreviewVersion(null)}
        version={previewVersion}
        currentContentHtml={currentNote?.content ?? ''}
        currentTitle={currentNote?.title ?? ''}
        editorMode={currentNote?.editorMode ?? 'rich'}
        onConfirmRestore={(versionId) => {
          if (currentNoteId) {
            restoreNoteVersion(currentNoteId, versionId)
          }
          setPreviewVersion(null)
        }}
      />
    </>
  )
}

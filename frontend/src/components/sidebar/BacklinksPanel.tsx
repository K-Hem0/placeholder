import { useMemo } from 'react'
import { useAppStore } from '../../store'
import { computeBacklinksWithSnippets } from '../../lib/wikiLinks'

function noteLabel(title: string) {
  const t = title.trim()
  return t.length > 0 ? t : 'Untitled'
}

export function BacklinksPanel() {
  const notes = useAppStore((s) => s.notes)
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const setCurrentNoteId = useAppStore((s) => s.setCurrentNoteId)

  const backlinks = useMemo(() => {
    if (!currentNoteId) return []
    return computeBacklinksWithSnippets(notes, currentNoteId)
  }, [notes, currentNoteId])

  if (!currentNoteId) {
    return (
      <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-600/90">
        Open a note to see backlinks.
      </p>
    )
  }

  if (backlinks.length === 0) {
    return (
      <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-600/90">
        No other notes link here yet. Use{' '}
        <span className="font-mono text-[11px] text-slate-600 dark:text-slate-500">
          [[title]]
        </span>{' '}
        in the editor.
      </p>
    )
  }

  return (
    <ul className="space-y-1.5" role="list">
      {backlinks.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => setCurrentNoteId(n.id)}
            className="w-full rounded-lg px-2 py-2 text-left transition hover:bg-slate-200/55 dark:hover:bg-white/[0.04]"
          >
            <span className="block text-[13px] font-medium leading-snug text-slate-800 dark:text-slate-300/95">
              {noteLabel(n.title)}
            </span>
            {n.snippet ? (
              <span className="mt-1 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-600/90">
                {n.snippet}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  )
}

import CodeMirror from '@uiw/react-codemirror'
import { basicSetup } from 'codemirror'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAppStore } from '../../store'
import { useSettingsStore } from '../../store/useSettingsStore'
import { cn } from '../../lib/cn'
import { downloadTexFile } from '../../lib/latexExport'
import { resolveThemePreference } from '../../lib/theme'
import { codemirrorLightTheme } from '../../lib/codemirrorLightTheme'
import { LatexMathPreview } from './LatexMathPreview'
import { useNoteHistorySnapshot } from '../../hooks/useNoteHistorySnapshot'

function maxWidthClass(w: 'narrow' | 'medium' | 'wide') {
  if (w === 'narrow') return 'max-w-[32rem]'
  if (w === 'wide') return 'max-w-[56rem]'
  return 'max-w-[40rem]'
}

type LatexNoteEditorProps = {
  noteId: string
}

export function LatexNoteEditor({ noteId }: LatexNoteEditorProps) {
  const notes = useAppStore((s) => s.notes)
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const updateCurrentNoteContent = useAppStore((s) => s.updateCurrentNoteContent)

  const editorMaxWidth = useSettingsStore((s) => s.editorMaxWidth)
  const compactMode = useSettingsStore((s) => s.compactMode)
  const themePreference = useSettingsStore((s) => s.themePreference)

  const note = useMemo(
    () => notes.find((n) => n.id === noteId) ?? null,
    [notes, noteId]
  )

  const resolvedTheme = resolveThemePreference(themePreference)

  const extensions = useMemo((): Extension[] => {
    const base: Extension[] = [
      basicSetup,
      EditorView.lineWrapping,
      EditorView.theme({
        '&': { fontSize: '12px' },
        '.cm-content': {
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        },
      }),
    ]
    if (resolvedTheme === 'dark') {
      base.push(oneDark)
    } else {
      base.push(codemirrorLightTheme)
    }
    return base
  }, [resolvedTheme])

  const lastEmittedRef = useRef<string | null>(null)

  const { onEditorModelUpdated } = useNoteHistorySnapshot({
    noteId,
    editorMode: 'latex',
  })

  useEffect(() => {
    if (!note) return
    lastEmittedRef.current = note.content
  }, [noteId])

  useEffect(() => {
    if (!note) return
    if (lastEmittedRef.current === note.content) return
    lastEmittedRef.current = note.content
  }, [note, note?.content])

  const onChange = useCallback(
    (value: string) => {
      lastEmittedRef.current = value
      updateCurrentNoteContent(value)
      onEditorModelUpdated()
    },
    [updateCurrentNoteContent, onEditorModelUpdated]
  )

  const padX = compactMode ? 'px-6' : 'px-8 sm:px-12'
  const padB = compactMode ? 'pb-20' : 'pb-32'
  const maxW = maxWidthClass(editorMaxWidth)

  const onExport = useCallback(() => {
    if (!note) return
    downloadTexFile(note.title, note.content)
  }, [note])

  if (!note) return null

  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col overflow-hidden border-t border-slate-200/25 pt-3 dark:border-white/[0.06]',
        padB,
        padX
      )}
    >
      <div className={cn('mx-auto w-full min-w-0', maxW)}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-md border border-sky-200/45 bg-sky-50/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-sky-900/75 dark:border-sky-500/18 dark:bg-sky-950/40 dark:text-sky-300/90">
              LaTeX
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-600/90">
              Source is plain text; math preview uses KaTeX.
            </span>
          </div>
          <button
            type="button"
            onClick={onExport}
            disabled={currentNoteId == null}
            className={cn(
              'rounded-lg border border-slate-200/45 bg-white/95 px-2.5 py-1 text-[11px] font-medium text-slate-700',
              'shadow-sm shadow-slate-900/[0.03] transition',
              'hover:border-slate-200/70 hover:bg-slate-50/95 hover:text-slate-900',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/20',
              'disabled:pointer-events-none disabled:opacity-50',
              'dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-300 dark:shadow-none dark:hover:bg-white/[0.07]'
            )}
          >
            Export .tex
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row lg:gap-0">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col border-slate-200/40 lg:border-r lg:pr-3 dark:border-white/[0.06]">
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400 dark:text-slate-600/90">
              Source
            </div>
            <div className="latex-cm-root min-h-[min(52dvh,520px)] w-full min-w-0 overflow-hidden rounded-xl border border-slate-200/40 bg-slate-50/80 shadow-sm shadow-slate-900/[0.03] ring-1 ring-inset ring-slate-200/25 dark:border-white/[0.08] dark:bg-[#0c0d12] dark:shadow-none dark:ring-white/[0.04]">
              <CodeMirror
                value={note.content}
                height="520px"
                extensions={extensions}
                onChange={onChange}
                className="h-full min-h-[280px] text-left [&_.cm-editor]:min-h-[280px] [&_.cm-editor]:outline-none [&_.cm-scroller]:overflow-auto"
                basicSetup={false}
              />
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-3">
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400 dark:text-slate-600/90">
              Preview
            </div>
            <div
              className={cn(
                'latex-preview-panel min-h-[min(52dvh,520px)] overflow-auto rounded-xl border border-slate-200/40 bg-slate-50/80 p-3.5 shadow-sm shadow-slate-900/[0.03] ring-1 ring-inset ring-slate-200/25',
                'dark:border-white/[0.08] dark:bg-[#12131a]/90 dark:shadow-none dark:ring-white/[0.04]'
              )}
            >
              <LatexMathPreview source={note.content} />
              <p className="mt-4 border-t border-slate-200/50 pt-3 text-[10px] leading-snug text-slate-500 dark:border-white/[0.06] dark:text-slate-600/90">
                Full document preview (PDF / non-math LaTeX) can be wired here later;
                equation blocks above use KaTeX delimiters: $…$, $$…$$, \(…\), […].
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

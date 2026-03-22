import CodeMirror from '@uiw/react-codemirror'
import { basicSetup } from 'codemirror'
import type { Extension } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import type { ViewUpdate } from '@codemirror/view'
import { oneDark } from '@codemirror/theme-one-dark'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAppStore } from '../../store'
import { useSettingsStore } from '../../store/useSettingsStore'
import { cn } from '../../lib/cn'
import { resolveThemePreference } from '../../lib/theme'
import { codemirrorLightTheme } from '../../lib/codemirrorLightTheme'
import { markdownShortcutsKeymap } from '../../lib/markdownShortcuts'
import { LatexMathPreview } from './LatexMathPreview'
import { useNoteHistorySnapshot } from '../../hooks/useNoteHistorySnapshot'

function maxWidthClass(w: 'narrow' | 'medium' | 'wide') {
  if (w === 'narrow') return 'max-w-[32rem]'
  if (w === 'wide') return 'max-w-[48rem]'
  return 'max-w-[36rem]'
}

type LatexNoteEditorProps = {
  noteId: string
}

export function LatexNoteEditor({ noteId }: LatexNoteEditorProps) {
  const notes = useAppStore((s) => s.notes)
  const updateCurrentNoteContent = useAppStore((s) => s.updateCurrentNoteContent)

  const editorMaxWidth = useSettingsStore((s) => s.editorMaxWidth)
  const compactMode = useSettingsStore((s) => s.compactMode)
  const themePreference = useSettingsStore((s) => s.themePreference)
  const lineFocus = useSettingsStore((s) => s.lineFocus)

  const note = useMemo(
    () => notes.find((n) => n.id === noteId) ?? null,
    [notes, noteId]
  )

  const resolvedTheme = resolveThemePreference(themePreference)

  const MIN_EDITOR_HEIGHT = 320

  const syncHeightToContent = useCallback((view: EditorView) => {
    requestAnimationFrame(() => {
      const container = view.dom.closest('.latex-cm-root') as HTMLElement | null
      if (!container) return
      const scrollHeight = view.scrollDOM.scrollHeight
      const h = Math.max(MIN_EDITOR_HEIGHT, scrollHeight)
      container.style.height = `${h}px`
    })
  }, [])

  const extensions = useMemo((): Extension[] => {
    const base: Extension[] = [
      markdownShortcutsKeymap(),
      basicSetup,
      EditorView.lineWrapping,
      EditorView.theme({
        '&': { fontSize: '12px' },
        '.cm-content': {
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        },
      }),
      EditorView.theme({
        '.cm-scroller': { overflow: 'hidden' },
      }),
      EditorView.theme({
        '&': { backgroundColor: 'transparent' },
        '.cm-gutters': { backgroundColor: 'transparent', border: 'none' },
      }),
    ]
    if (resolvedTheme === 'dark') {
      base.push(oneDark)
    } else {
      base.push(codemirrorLightTheme)
    }
    if (lineFocus) {
      base.push(
        EditorView.theme({
          '.cm-line': { opacity: '0.42', transition: 'opacity 0.18s ease' },
          '.cm-activeLine': { opacity: '1' },
        })
      )
    }
    return base
  }, [resolvedTheme, lineFocus])

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
  const maxW = maxWidthClass(editorMaxWidth)

  if (!note) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 pb-24 text-center">
        <p className="max-w-[24rem] text-[13px] leading-relaxed text-slate-500 dark:text-slate-600/90">
          This note is not available in the workspace. Choose another note in the
          sidebar or create a new one.
        </p>
      </div>
    )
  }

  const [showPreview, setShowPreview] = useState(false)

  return (
    <div
      className={cn(
        'border-t border-slate-200/25 pt-3 dark:border-white/[0.06]',
        padX
      )}
    >
      <div className={cn('mx-auto w-full min-w-0', maxW)}>
        <div className="mb-3 flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150',
              'border-slate-200/45 bg-white/95 text-slate-700',
              'hover:border-slate-200/70 hover:bg-slate-50/95',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/20',
              'dark:border-white/[0.1] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.07]',
              showPreview && 'ring-2 ring-sky-400/30 bg-sky-50/80 dark:bg-sky-950/30'
            )}
          >
            {showPreview ? '← Source' : 'Preview'}
          </button>
        </div>

        {showPreview ? (
          <div className="content-fade-in latex-preview-panel pt-2 pb-16">
            <LatexMathPreview source={note.content ?? ''} />
          </div>
        ) : (
          <div className="latex-cm-root min-h-[min(40dvh,320px)] w-full min-w-0 pt-2 pb-2 transition-[height] duration-150 ease-out [&_.cm-editor]:!bg-transparent [&_.cm-scroller]:!bg-transparent">
            <CodeMirror
              value={note.content ?? ''}
              height="100%"
              extensions={extensions}
              onChange={onChange}
              onCreateEditor={(view) => syncHeightToContent(view)}
              onUpdate={(vu: ViewUpdate) => syncHeightToContent(vu.view)}
              className="min-h-[320px] text-left [&_.cm-editor]:min-h-[320px] [&_.cm-editor]:h-full [&_.cm-editor]:outline-none"
              basicSetup={false}
            />
          </div>
        )}
      </div>
    </div>
  )
}

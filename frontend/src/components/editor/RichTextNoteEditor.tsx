import { EditorContent, useEditor } from '@tiptap/react'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useAppStore } from '../../store'
import { useUiStore } from '../../store/useUiStore'
import { createEditorExtensions } from '../../lib/tiptapExtensions'
import { EditorToolbar } from './EditorToolbar'
import { findNoteIdByTitle } from '../../lib/wikiLinks'
import { useSettingsStore } from '../../store/useSettingsStore'
import { cn } from '../../lib/cn'
import { registerEditorForShortcuts } from '../../lib/editorShortcutBridge'
import { useNoteHistorySnapshot } from '../../hooks/useNoteHistorySnapshot'

const EDITOR_BODY_BASE =
  'notes-editor max-w-none px-0 py-1 text-[12px] leading-[1.72] text-slate-800 focus:outline-none dark:text-slate-300/95 ' +
  '[&_.ProseMirror]:min-h-[max(100%,min(60dvh,460px))] [&_.ProseMirror]:cursor-text ' +
  '[&_p]:my-[0.85em] [&_p:first-child]:mt-0 ' +
  '[&_ul]:my-[0.85em] [&_ol]:my-[0.85em] [&_ul]:pl-[1.35em] [&_ol]:pl-[1.45em] ' +
  '[&_li]:my-1 [&_li]:marker:text-slate-500 dark:[&_li]:marker:text-slate-500/80 ' +
  '[&_li]:pl-1 [&_ul_ul]:my-2 [&_ol_ol]:my-2 ' +
  '[&_h1]:mb-2 [&_h1]:mt-[1.35em] [&_h1]:text-[1.25em] [&_h1]:font-semibold [&_h1]:tracking-[-0.01em] [&_h1]:leading-snug [&_h1]:text-slate-900 dark:[&_h1]:text-slate-50 [&_h1]:first:mt-0 ' +
  '[&_h2]:mb-1.5 [&_h2]:mt-[1.15em] [&_h2]:text-[1.125em] [&_h2]:font-semibold [&_h2]:tracking-[-0.008em] [&_h2]:leading-snug [&_h2]:text-slate-900 dark:[&_h2]:text-slate-100 [&_h2]:first:mt-0 ' +
  '[&_h3]:mb-1.5 [&_h3]:mt-[1em] [&_h3]:text-[1.0625em] [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:leading-snug [&_h3]:text-slate-900 dark:[&_h3]:text-slate-200 [&_h3]:first:mt-0 ' +
  '[&_blockquote]:my-[0.85em] [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300/90 [&_blockquote]:pl-4 [&_blockquote]:text-slate-700 dark:[&_blockquote]:border-white/[0.12] dark:[&_blockquote]:text-slate-400/95 ' +
  '[&_code]:rounded-md [&_code]:bg-slate-200/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:font-medium [&_code]:text-slate-800 dark:[&_code]:bg-white/[0.08] dark:[&_code]:text-slate-200/95 ' +
  '[&_pre]:my-[0.85em] [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-slate-200/80 [&_pre]:bg-slate-100/80 [&_pre]:p-4 [&_pre]:text-[11px] [&_pre]:leading-relaxed [&_pre]:text-slate-800 dark:[&_pre]:border-white/[0.06] dark:[&_pre]:bg-[#12131a] dark:[&_pre]:text-slate-300/95 ' +
  '[&_strong]:font-semibold [&_em]:italic [&_s]:text-slate-600 dark:[&_s]:text-slate-500 ' +
  '[&_hr]:my-8 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-slate-200/90 dark:[&_hr]:border-white/[0.08] ' +
  '[&_a]:underline-offset-2'

function maxWidthClass(w: 'narrow' | 'medium' | 'wide') {
  if (w === 'narrow') return 'max-w-[32rem]'
  if (w === 'wide') return 'max-w-[56rem]'
  return 'max-w-[40rem]'
}

type RichTextNoteEditorProps = {
  noteId: string
}

export function RichTextNoteEditor({ noteId }: RichTextNoteEditorProps) {
  const notes = useAppStore((s) => s.notes)
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const updateCurrentNoteContent = useAppStore((s) => s.updateCurrentNoteContent)
  const setCurrentNoteId = useAppStore((s) => s.setCurrentNoteId)
  const ensureNoteForWikiTitle = useAppStore((s) => s.ensureNoteForWikiTitle)
  const notesTitleSig = useAppStore((s) =>
    s.notes.map((n) => `${n.id}:${n.title}`).join('\0')
  )

  const editorMaxWidth = useSettingsStore((s) => s.editorMaxWidth)
  const lineFocus = useSettingsStore((s) => s.lineFocus)
  const compactMode = useSettingsStore((s) => s.compactMode)
  const distractionFree = useSettingsStore((s) => s.distractionFree)
  const setDistractionFree = useSettingsStore((s) => s.setDistractionFree)

  const focusToken = useUiStore((s) => s.focusToken)

  const note = useMemo(
    () => notes.find((n) => n.id === noteId) ?? null,
    [notes, noteId]
  )

  const extensions = useMemo(() => createEditorExtensions(), [])

  const { onEditorModelUpdated } = useNoteHistorySnapshot({
    noteId,
    editorMode: note?.editorMode ?? 'rich',
  })

  const lastSnapRef = useRef<string>('')
  const lastFocusTokenRef = useRef(0)
  const editor = useEditor(
    {
      extensions,
      content: '',
      editorProps: {
        attributes: {
          class: cn(EDITOR_BODY_BASE, lineFocus && 'line-focus'),
          spellcheck: 'true',
        },
      },
      onUpdate: ({ editor: ed }) => {
        updateCurrentNoteContent(ed.getHTML())
        onEditorModelUpdated()
      },
    },
    [extensions, updateCurrentNoteContent, onEditorModelUpdated]
  )

  useEffect(() => {
    registerEditorForShortcuts(editor)
    return () => registerEditorForShortcuts(null)
  }, [editor])

  useEffect(() => {
    if (!editor) return
    editor.setEditable(currentNoteId != null)
  }, [editor, currentNoteId])

  useEffect(() => {
    if (!editor) return
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: {
          ...editor.options.editorProps?.attributes,
          class: cn(EDITOR_BODY_BASE, lineFocus && 'line-focus'),
          spellcheck: 'true',
        },
      },
    })
  }, [editor, lineFocus])

  useEffect(() => {
    if (!editor) return
    const { notes: latestNotes, currentNoteId: id } = useAppStore.getState()
    if (id == null) {
      editor.commands.setContent('', { emitUpdate: false })
      lastSnapRef.current = ''
      return
    }
    const n = latestNotes.find((x) => x.id === id)
    if (!n) return
    const html = n.content || ''
    const current = editor.getHTML()
    if (current === html) return
    editor.commands.setContent(html, { emitUpdate: false })
    lastSnapRef.current = html
  }, [editor, currentNoteId, note?.content])

  useEffect(() => {
    if (!editor) return
    if (focusToken === 0) return
    if (focusToken === lastFocusTokenRef.current) return
    lastFocusTokenRef.current = focusToken
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const curId = useAppStore.getState().currentNoteId
        if (!curId) return
        const n = useAppStore.getState().notes.find((x) => x.id === curId)
        if (!n) return
        editor.chain().focus('end').run()
      })
    })
    return () => cancelAnimationFrame(id)
  }, [focusToken, editor])

  useEffect(() => {
    if (!editor) return
    const syncWikiResolved = () => {
      const list = useAppStore.getState().notes.map((x) => ({
        id: x.id,
        title: x.title,
      }))
      const root = editor.view.dom as HTMLElement
      root.querySelectorAll('[data-wiki-link]').forEach((el) => {
        if (!(el instanceof HTMLElement)) return
        const title = el.getAttribute('data-wiki-title')?.trim()
        if (!title) return
        const resolved = findNoteIdByTitle(list, title) != null
        el.classList.toggle('wiki-link--unresolved', !resolved)
      })
    }
    syncWikiResolved()
    editor.on('update', syncWikiResolved)
    return () => {
      editor.off('update', syncWikiResolved)
    }
  }, [editor, notesTitleSig])

  const onWikiClick = useCallback(
    (e: React.MouseEvent) => {
      const el = (e.target as HTMLElement).closest('[data-wiki-link]')
      if (!el) return
      const title = el.getAttribute('data-wiki-title')?.trim()
      if (!title) return
      e.preventDefault()
      const id = ensureNoteForWikiTitle(title)
      if (id) setCurrentNoteId(id)
    },
    [ensureNoteForWikiTitle, setCurrentNoteId]
  )

  const onEditorCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      if (!editor) return
      if (!editor.isEditable) return

      const target = e.target as HTMLElement
      if (target.closest('[data-wiki-link]')) return
      if (target.closest('input, textarea, button, select')) return

      const view = editor.view
      const dom = view.dom as HTMLElement
      const canvas = e.currentTarget as HTMLElement

      const inPm = dom.contains(e.target as Node)
      if (!inPm && canvas.contains(e.target as Node)) {
        e.preventDefault()
        editor.chain().focus('end').run()
        return
      }

      if (!inPm) return

      const coords = view.posAtCoords({ left: e.clientX, top: e.clientY })
      if (coords == null) {
        e.preventDefault()
        editor.chain().focus('end').run()
        return
      }

      let lastBottom = -Infinity
      dom.childNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const r = (node as HTMLElement).getBoundingClientRect()
          lastBottom = Math.max(lastBottom, r.bottom)
        }
      })

      if (lastBottom > -Infinity && e.clientY > lastBottom + 4) {
        e.preventDefault()
        editor.chain().focus('end').run()
      }
    },
    [editor]
  )

  const padX = compactMode ? 'px-6' : 'px-8 sm:px-12'
  const padB = compactMode
    ? 'pb-[calc(5rem+env(safe-area-inset-bottom,0px))]'
    : 'pb-[calc(8rem+env(safe-area-inset-bottom,0px))]'
  const maxW = maxWidthClass(editorMaxWidth)

  if (!note) return null

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={cn('mx-auto w-full min-w-0 shrink-0 pt-3', maxW, padX)}>
        <div
          className={cn(
            'rounded-[10px] border border-[color:var(--app-sidebar-border)] bg-[var(--app-toolbar-surface)]',
            'px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.42)]',
            'dark:border-white/[0.06] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
          )}
        >
          {editor ? (
            <EditorToolbar
              editor={editor}
              rightSlot={
                <button
                  type="button"
                  title="Distraction-free mode"
                  aria-pressed={distractionFree}
                  onClick={() => setDistractionFree(!distractionFree)}
                  className={cn(
                    'rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors duration-100',
                    'hover:bg-slate-200/45 hover:text-slate-900',
                    'active:bg-slate-200/60',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
                    'dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-slate-100',
                    'dark:active:bg-white/[0.09] dark:focus-visible:ring-sky-400/20',
                    distractionFree &&
                      'bg-slate-200/45 text-sky-800 dark:bg-white/[0.08] dark:text-sky-300/95'
                  )}
                >
                  Focus
                </button>
              }
            />
          ) : (
            <div className="py-0.5 text-[11px] text-slate-400 dark:text-slate-500/90">
              Loading toolbar…
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden',
          padB,
          padX
        )}
      >
        <div
          className={cn(
            'mx-auto flex min-h-full w-full min-w-0 flex-1 flex-col',
            maxW
          )}
        >
          {editor ? (
            <div
              role="presentation"
              className="flex min-h-0 min-w-0 flex-1 flex-col pt-3"
              onMouseDown={onEditorCanvasMouseDown}
              onClick={onWikiClick}
            >
              <EditorContent
                editor={editor}
                className="flex min-h-0 min-w-0 flex-1 flex-col [&_.ProseMirror]:flex-1"
              />
            </div>
          ) : (
            <div className="py-10 text-sm text-slate-500 dark:text-slate-500/90">
              Loading editor…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

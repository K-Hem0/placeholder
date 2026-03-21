import { EditorContent, useEditor } from '@tiptap/react'
import { useCallback, useEffect, useId, useMemo, useRef } from 'react'
import { useAppStore } from '../../store'
import { useUiStore } from '../../store/useUiStore'
import { createEditorExtensions } from '../../lib/tiptapExtensions'
import { EditorToolbar } from './EditorToolbar'
import { findNoteIdByTitle } from '../../lib/wikiLinks'
import { useSettingsStore } from '../../store/useSettingsStore'
import { cn } from '../../lib/cn'
import { shortcutNewNote, shortcutTemplatePicker } from '../../lib/platformKeys'
import { registerEditorForShortcuts } from '../../lib/editorShortcutBridge'

const EDITOR_BODY_BASE =
  'notes-editor max-w-none px-0 py-1 text-[16px] leading-[1.72] text-slate-800 focus:outline-none dark:text-slate-300/95 ' +
  '[&_.ProseMirror]:min-h-[max(100%,min(60vh,460px))] [&_.ProseMirror]:cursor-text ' +
  '[&_p]:my-[0.85em] [&_p:first-child]:mt-0 ' +
  '[&_ul]:my-[0.85em] [&_ol]:my-[0.85em] [&_ul]:pl-[1.35em] [&_ol]:pl-[1.45em] ' +
  '[&_li]:my-1 [&_li]:marker:text-slate-500 dark:[&_li]:marker:text-slate-500/80 ' +
  '[&_li]:pl-1 [&_ul_ul]:my-2 [&_ol_ol]:my-2 ' +
  '[&_h1]:mb-3 [&_h1]:mt-[1.75em] [&_h1]:text-[1.875rem] [&_h1]:font-semibold [&_h1]:tracking-[-0.02em] [&_h1]:leading-tight [&_h1]:text-slate-900 dark:[&_h1]:text-slate-50 [&_h1]:first:mt-0 ' +
  '[&_h2]:mb-2 [&_h2]:mt-[1.35em] [&_h2]:text-[1.35rem] [&_h2]:font-semibold [&_h2]:tracking-[-0.015em] [&_h2]:leading-snug [&_h2]:text-slate-900 dark:[&_h2]:text-slate-100 [&_h2]:first:mt-0 ' +
  '[&_h3]:mb-2 [&_h3]:mt-[1.1em] [&_h3]:text-[1.125rem] [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-slate-900 dark:[&_h3]:text-slate-200 [&_h3]:first:mt-0 ' +
  '[&_blockquote]:my-[0.85em] [&_blockquote]:border-l-2 [&_blockquote]:border-slate-300/90 [&_blockquote]:pl-4 [&_blockquote]:text-slate-700 dark:[&_blockquote]:border-white/[0.12] dark:[&_blockquote]:text-slate-400/95 ' +
  '[&_code]:rounded-md [&_code]:bg-slate-200/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:font-medium [&_code]:text-slate-800 dark:[&_code]:bg-white/[0.08] dark:[&_code]:text-slate-200/95 ' +
  '[&_pre]:my-[0.85em] [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-slate-200/80 [&_pre]:bg-slate-100/80 [&_pre]:p-4 [&_pre]:text-[14px] [&_pre]:leading-relaxed [&_pre]:text-slate-800 dark:[&_pre]:border-white/[0.06] dark:[&_pre]:bg-[#12131a] dark:[&_pre]:text-slate-300/95 ' +
  '[&_strong]:font-semibold [&_em]:italic [&_s]:text-slate-600 dark:[&_s]:text-slate-500 ' +
  '[&_hr]:my-8 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-slate-200/90 dark:[&_hr]:border-white/[0.08] ' +
  '[&_a]:underline-offset-2'

function maxWidthClass(w: 'narrow' | 'medium' | 'wide') {
  if (w === 'narrow') return 'max-w-[32rem]'
  if (w === 'wide') return 'max-w-[56rem]'
  return 'max-w-[40rem]'
}

export function EditorPane() {
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const notes = useAppStore((s) => s.notes)
  const updateCurrentNoteContent = useAppStore((s) => s.updateCurrentNoteContent)
  const updateCurrentNoteTitle = useAppStore((s) => s.updateCurrentNoteTitle)
  const updateCurrentNoteTags = useAppStore((s) => s.updateCurrentNoteTags)
  const updateCurrentNoteFolder = useAppStore((s) => s.updateCurrentNoteFolder)
  const setCurrentNoteId = useAppStore((s) => s.setCurrentNoteId)
  const pushVersionSnapshot = useAppStore((s) => s.pushVersionSnapshot)
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

  const currentNote =
    currentNoteId != null
      ? notes.find((n) => n.id === currentNoteId) ?? null
      : null

  const folderListId = useId()
  const folders = useMemo(() => {
    const s = new Set<string>()
    for (const n of notes) {
      const f = n.folder.trim()
      if (f) s.add(f)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [notes])

  const extensions = useMemo(() => createEditorExtensions(), [])

  const lastSnapRef = useRef<string>('')
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
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
        const id = useAppStore.getState().currentNoteId
        if (!id) return
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = setTimeout(() => {
          const note = useAppStore.getState().notes.find((n) => n.id === id)
          if (!note) return
          const prev = lastSnapRef.current
          if (note.content === prev) return
          pushVersionSnapshot(id, prev, note.content, note.title)
          lastSnapRef.current = note.content
        }, 2000)
      },
    },
    [extensions, updateCurrentNoteContent, pushVersionSnapshot]
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
    const note = latestNotes.find((n) => n.id === id)
    if (!note) return
    const html = note.content || ''
    const current = editor.getHTML()
    if (current === html) return
    editor.commands.setContent(html, { emitUpdate: false })
    lastSnapRef.current = html
  }, [editor, currentNoteId, currentNote?.content])

  useEffect(() => {
    if (!editor) return
    if (focusToken === 0) return
    if (focusToken === lastFocusTokenRef.current) return
    lastFocusTokenRef.current = focusToken
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const curId = useAppStore.getState().currentNoteId
        if (!curId) return
        const note = useAppStore.getState().notes.find((n) => n.id === curId)
        if (!note) return
        const ed = editor
        if (!note.title.trim()) {
          titleInputRef.current?.focus()
        } else {
          ed.chain().focus('end').run()
        }
      })
    })
    return () => cancelAnimationFrame(id)
  }, [focusToken, editor])

  useEffect(() => {
    if (!editor) return
    const syncWikiResolved = () => {
      const list = useAppStore.getState().notes.map((n) => ({
        id: n.id,
        title: n.title,
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

  /** Full-canvas focus: empty padding and space below the last block act like the editor surface. */
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
  const padB = compactMode ? 'pb-20' : 'pb-32'
  const padT = compactMode ? 'pt-8 sm:pt-10' : 'pt-10 sm:pt-12'
  const maxW = maxWidthClass(editorMaxWidth)

  const kbdHint =
    'rounded-md border border-slate-200/80 bg-slate-100/80 px-1.5 py-0.5 font-mono text-[12px] text-slate-800 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-slate-300'

  if (!currentNote) {
    return (
      <div className="relative flex h-full min-h-0 flex-col items-center justify-center px-12 pb-20 text-center">
        <p className="max-w-[28rem] text-[15px] leading-[1.65] text-slate-600 dark:text-slate-500/90">
          Press{' '}
          <kbd className={kbdHint}>{shortcutNewNote()}</kbd> to create a new note, or
          choose a template from the left panel (
          <kbd className={kbdHint}>{shortcutTemplatePicker()}</kbd>
          ).
        </p>
      </div>
    )
  }

  const tagsStr = currentNote.tags.join(', ')
  const metaClass =
    'w-full border-0 bg-transparent px-0 py-0.5 text-[12px] leading-snug text-slate-700/90 placeholder:text-slate-400/50 outline-none transition-[background,color] duration-100 ' +
    'rounded-sm hover:bg-slate-100/30 focus:bg-slate-100/35 focus:outline-none focus:ring-0 ' +
    'dark:text-slate-300/93 dark:placeholder:text-slate-600/60 dark:hover:bg-white/[0.03] dark:focus:bg-white/[0.05]'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn('shrink-0', padT, padX)}>
        <div className={cn('mx-auto w-full', maxW)}>
          <label className="sr-only" htmlFor="note-title">
            Note title
          </label>
          <input
            ref={titleInputRef}
            id="note-title"
            type="text"
            value={currentNote.title}
            onChange={(e) => updateCurrentNoteTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full border-0 bg-transparent text-[1.875rem] font-semibold leading-[1.15] tracking-[-0.035em] text-slate-900 placeholder:text-slate-400/75 focus:outline-none focus:ring-0 dark:text-slate-50 dark:placeholder:text-slate-600/75 sm:text-[2rem]"
          />
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-[minmax(0,1fr)_9.5rem] sm:items-end">
            <div className="min-w-0">
              <label
                className="mb-1 block text-[10px] font-normal uppercase tracking-[0.06em] text-slate-400/75 dark:text-slate-500/75"
                htmlFor="note-tags"
              >
                Tags
              </label>
              <input
                id="note-tags"
                type="text"
                value={tagsStr}
                onChange={(e) => {
                  const raw = e.target.value
                  const tags = raw
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                  updateCurrentNoteTags(tags)
                }}
                placeholder="Add tags…"
                className={metaClass}
              />
            </div>
            <div className="min-w-0 sm:max-w-[9.5rem]">
              <label
                className="mb-1 block text-[10px] font-normal uppercase tracking-[0.06em] text-slate-400/75 dark:text-slate-500/75"
                htmlFor="note-folder"
              >
                Folder
              </label>
              <input
                id="note-folder"
                type="text"
                value={currentNote.folder}
                onChange={(e) => updateCurrentNoteFolder(e.target.value)}
                placeholder="Inbox"
                list={folderListId}
                className={metaClass}
              />
              <datalist id={folderListId}>
                {folders.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'mx-auto w-full min-w-0 shrink-0 border-t border-slate-200/25 bg-transparent pt-3 dark:border-white/[0.06]',
          maxW,
          padX
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
                  'rounded-sm px-1.5 py-0.5 text-[11px] font-normal text-slate-500 transition-colors duration-100',
                  distractionFree
                    ? 'text-sky-800 dark:text-sky-300/95'
                    : 'hover:bg-slate-200/40 hover:text-slate-800 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
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

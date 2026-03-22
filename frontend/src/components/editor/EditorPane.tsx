import { useId, useMemo, useRef } from 'react'
import { useAppStore } from '../../store'
import { useSettingsStore } from '../../store/useSettingsStore'
import { cn } from '../../lib/cn'
import { shortcutNewNote, shortcutTemplatePicker } from '../../lib/platformKeys'
import { RichTextNoteEditor } from './RichTextNoteEditor'

export function EditorPane() {
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const notes = useAppStore((s) => s.notes)
  const updateCurrentNoteTitle = useAppStore((s) => s.updateCurrentNoteTitle)
  const updateCurrentNoteTags = useAppStore((s) => s.updateCurrentNoteTags)
  const updateCurrentNoteFolder = useAppStore((s) => s.updateCurrentNoteFolder)

  const compactMode = useSettingsStore((s) => s.compactMode)
  const editorMaxWidth = useSettingsStore((s) => s.editorMaxWidth)

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

  const titleInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const padX = compactMode ? 'px-6' : 'px-8 sm:px-12'
  const padT = compactMode ? 'pt-8 sm:pt-10' : 'pt-10 sm:pt-12'
  const padB = compactMode ? 'pb-20' : 'pb-32'

  const maxW =
    editorMaxWidth === 'narrow'
      ? 'max-w-[32rem]'
      : editorMaxWidth === 'wide'
        ? 'max-w-[48rem]'
        : 'max-w-[36rem]'

  const kbdHint =
    'rounded-md border border-slate-200/80 bg-slate-100/80 px-1.5 py-0.5 font-mono text-[12px] text-slate-800 dark:border-white/[0.1] dark:bg-white/[0.06] dark:text-slate-300'

  if (!currentNote) {
    return (
      <div className="relative flex h-full min-h-0 flex-col items-center justify-center px-12 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] text-center">
        <p className="max-w-[28rem] text-[15px] leading-[1.65] text-slate-600 dark:text-slate-500/90">
          Press{' '}
          <kbd className={kbdHint}>{shortcutNewNote()}</kbd> to create a new note,
          or choose a template from the left panel (
          <kbd className={kbdHint}>{shortcutTemplatePicker()}</kbd>
          ).
        </p>
      </div>
    )
  }

  const tags = Array.isArray(currentNote.tags) ? currentNote.tags : []
  const folder =
    typeof currentNote.folder === 'string' ? currentNote.folder : ''
  const tagsStr = tags.join(', ')
  const metaClass =
    'w-full border-0 bg-transparent px-0 py-0.5 text-[12px] leading-snug text-slate-700/90 placeholder:text-slate-400/50 outline-none transition-colors duration-150 ' +
    'rounded-sm focus:outline-none focus:ring-0 ' +
    'dark:text-slate-300/93 dark:placeholder:text-slate-600/60'

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          'editor-note-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden',
          padX,
          padB
        )}
      >
        <div className={cn('mx-auto w-full', maxW, padT)}>
          <label className="sr-only" htmlFor="note-title">
            Note title
          </label>
          <input
            ref={titleInputRef}
            id="note-title"
            type="text"
            value={currentNote.title ?? ''}
            onChange={(e) => updateCurrentNoteTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full border-0 bg-transparent text-[1.875rem] font-semibold leading-[1.15] tracking-[-0.035em] text-slate-900 transition-colors duration-150 placeholder:text-slate-400/75 focus:outline-none focus:ring-0 dark:text-slate-50 dark:placeholder:text-slate-600/75 sm:text-[2rem]"
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
                ref={folderInputRef}
                id="note-folder"
                type="text"
                value={folder}
                onChange={(e) => {
                  const v = e.target.value
                  updateCurrentNoteFolder(v)
                  if (folders.includes(v.trim())) folderInputRef.current?.blur()
                }}
                placeholder="Inbox"
                list={folderListId}
                autoComplete="off"
                className={cn(metaClass, 'note-folder-input')}
              />
              <datalist id={folderListId}>
                {folders.map((f) => (
                  <option key={f} value={f} />
                ))}
              </datalist>
            </div>
          </div>
        </div>

        <RichTextNoteEditor noteId={currentNote.id} />
      </div>
    </div>
  )
}

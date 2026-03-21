import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '../../store'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useUiStore } from '../../store/useUiStore'
import { sortNotesList } from '../../lib/sortNotes'
import type { NoteTemplateId } from '../../types'
import { cn } from '../../lib/cn'
import { SelectMenu } from '../ui/SelectMenu'
import { selectMenuItemClass, selectMenuPanelClass } from '../ui/selectMenuStyles'
import { TemplatePicker } from '../templates/TemplatePicker'

function noteLabel(title: string) {
  const t = title.trim()
  return t.length > 0 ? t : 'Untitled'
}

export function NoteList() {
  const notes = useAppStore((s) => s.notes)
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const setCurrentNoteId = useAppStore((s) => s.setCurrentNoteId)
  const addNote = useAppStore((s) => s.addNote)
  const addNoteFromTemplate = useAppStore((s) => s.addNoteFromTemplate)
  const deleteNote = useAppStore((s) => s.deleteNote)

  const sortNotes = useSettingsStore((s) => s.sortNotes)
  const confirmBeforeDelete = useSettingsStore((s) => s.confirmBeforeDelete)
  const compactMode = useSettingsStore((s) => s.compactMode)

  const [folderFilter, setFolderFilter] = useState<string>('__all__')
  const [menu, setMenu] = useState<{
    noteId: string
    x: number
    y: number
  } | null>(null)
  const templatePickerOpen = useUiStore((s) => s.templatePickerOpen)
  const setTemplatePickerOpen = useUiStore((s) => s.setTemplatePickerOpen)
  const newNoteSplitRef = useRef<HTMLDivElement>(null)

  const folders = useMemo(() => {
    const s = new Set<string>()
    for (const n of notes) {
      const f = n.folder.trim()
      if (f) s.add(f)
    }
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [notes])

  const folderOptions = useMemo(
    () => [
      { value: '__all__', label: 'All folders' },
      { value: '__inbox__', label: 'Inbox only' },
      ...folders.map((f) => ({ value: f, label: f })),
    ],
    [folders]
  )

  const filteredSorted = useMemo(() => {
    const base =
      folderFilter === '__all__'
        ? notes
        : folderFilter === '__inbox__'
          ? notes.filter((n) => !n.folder.trim())
          : notes.filter((n) => n.folder.trim() === folderFilter)
    return sortNotesList(base, sortNotes)
  }, [notes, folderFilter, sortNotes])

  const requestDelete = useCallback(
    (id: string) => {
      if (confirmBeforeDelete) {
        if (
          typeof window !== 'undefined' &&
          !window.confirm('Delete this note? This cannot be undone.')
        ) {
          return
        }
      }
      deleteNote(id)
      setMenu(null)
    },
    [confirmBeforeDelete, deleteNote]
  )

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('scroll', close, true)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', close, true)
      document.removeEventListener('keydown', onKey)
    }
  }, [menu])

  const padTop = compactMode ? 'pt-5' : 'pt-7'

  const onTemplatePick = useCallback(
    (id: NoteTemplateId) => {
      addNoteFromTemplate(id)
    },
    [addNoteFromTemplate]
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header
        className={cn(
          'flex shrink-0 flex-col gap-2 px-3 pb-2.5 sm:px-3.5',
          padTop,
          compactMode && 'px-2.5'
        )}
        aria-label="Notes"
      >
        <div
          ref={newNoteSplitRef}
          className={cn(
            'flex w-full min-w-0 items-stretch overflow-hidden rounded-lg',
            'border border-slate-200/70 bg-white/75 shadow-sm shadow-slate-900/[0.04]',
            'dark:border-white/[0.09] dark:bg-white/[0.045] dark:shadow-black/20'
          )}
        >
          <button
            type="button"
            onClick={() => addNote()}
            className={cn(
              'min-w-0 flex-1 px-3 py-1.5 text-left text-[12px] font-semibold text-slate-800 transition',
              'hover:bg-slate-100/90 hover:text-slate-950',
              'focus:relative focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
              'dark:text-slate-100/95 dark:hover:bg-white/[0.07] dark:hover:text-slate-50'
            )}
          >
            <span className="block truncate">New note</span>
          </button>
          <div
            className="w-px shrink-0 self-stretch bg-slate-200/70 dark:bg-white/[0.08]"
            aria-hidden
          />
          <button
            type="button"
            aria-expanded={templatePickerOpen}
            aria-haspopup="dialog"
            aria-label="Templates"
            title="Templates"
            onClick={() => setTemplatePickerOpen(!templatePickerOpen)}
            className={cn(
              'flex shrink-0 items-center justify-center px-2 py-1.5 text-slate-500 transition',
              'hover:bg-slate-100/90 hover:text-slate-800',
              'focus:relative focus:z-10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
              'dark:text-slate-500 dark:hover:bg-white/[0.07] dark:hover:text-slate-200',
              templatePickerOpen &&
                'bg-slate-100/90 text-slate-900 dark:bg-white/[0.08] dark:text-slate-100'
            )}
          >
            <ChevronIcon open={templatePickerOpen} />
          </button>
        </div>

        <TemplatePicker
          open={templatePickerOpen}
          onOpenChange={setTemplatePickerOpen}
          anchorRef={newNoteSplitRef}
          onSelectTemplate={onTemplatePick}
        />

        <div className="w-full min-w-0">
          <SelectMenu
            value={folderFilter}
            onChange={setFolderFilter}
            options={folderOptions}
            variant="panel"
            searchable
            ariaLabel="Filter notes by folder"
            className="w-full min-w-0"
          />
        </div>
      </header>

      <ul
        className={cn(
          'min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-10',
          compactMode && 'space-y-0 px-2.5 pb-8'
        )}
        role="list"
        aria-label="Notes"
      >
        {filteredSorted.length === 0 ? (
          <li className="px-3 py-12 text-center text-[12px] leading-relaxed text-slate-500 dark:text-slate-600/80">
            No notes in this view
          </li>
        ) : (
          filteredSorted.map((note) => {
            const active = note.id === currentNoteId
            return (
              <li key={note.id} className="group relative">
                <div
                  className={
                    active
                      ? 'flex items-stretch gap-0.5 rounded-lg bg-slate-200/65 dark:bg-white/[0.04]'
                      : 'flex items-stretch gap-0.5 rounded-lg transition hover:bg-slate-200/45 dark:hover:bg-white/[0.025]'
                  }
                >
                  <button
                    type="button"
                    onClick={() => setCurrentNoteId(note.id)}
                    onContextMenu={(e) => {
                      e.preventDefault()
                      setMenu({ noteId: note.id, x: e.clientX, y: e.clientY })
                    }}
                    aria-current={active ? 'true' : undefined}
                    className={
                      active
                        ? 'min-w-0 flex-1 px-3 py-2.5 text-left text-[13px] leading-snug text-slate-900 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/30 dark:text-slate-200/95'
                        : 'min-w-0 flex-1 px-3 py-2.5 text-left text-[13px] leading-snug text-slate-600 transition focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/30 dark:text-slate-500/90'
                    }
                  >
                    <span className="line-clamp-2 break-words">
                      {noteLabel(note.title)}
                    </span>
                    {note.folder.trim() ? (
                      <span className="mt-0.5 block text-[11px] font-normal text-slate-500/90 dark:text-slate-600/90">
                        {note.folder.trim()}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete “${noteLabel(note.title)}”`}
                    title="Delete note"
                    onClick={(e) => {
                      e.stopPropagation()
                      requestDelete(note.id)
                    }}
                    className="shrink-0 self-start rounded-md px-1.5 py-2 text-slate-500 opacity-0 transition hover:text-slate-800 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/30 dark:text-slate-600 dark:hover:text-slate-400"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </li>
            )
          })
        )}
      </ul>
      {menu &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default bg-transparent"
              onClick={() => setMenu(null)}
            />
            <div
              role="menu"
              className={cn(
                selectMenuPanelClass,
                'fixed z-50 min-w-[10rem] origin-top px-1 py-1.5',
                'menu-pop-in'
              )}
              style={{
                left: Math.min(menu.x, window.innerWidth - 160),
                top: Math.min(menu.y, window.innerHeight - 48),
              }}
            >
              <button
                type="button"
                role="menuitem"
                className={selectMenuItemClass(false, true)}
                onClick={() => requestDelete(menu.noteId)}
              >
                Delete note…
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn(
        'h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-500/90',
        open && 'rotate-180'
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import type { SuggestionProps } from '@tiptap/suggestion'
import { cn } from '../../lib/cn'
import { wikiLinkMenuKeyHandlerRef } from '../../lib/wikiLinkMenuKeyHandler'
import {
  toolbarMenuItemClass,
  toolbarMenuPanelClass,
} from '../ui/selectMenuStyles'
import type { Note } from '../../types'

type WikiLinkMenuProps = SuggestionProps<Note, Note>

/** Minimal note shape for confirming a link to a title that has no list match yet. */
const syntheticNote = (title: string): Note => ({
  id: '__wiki_new__',
  title,
  content: '',
  tags: [],
  folder: '',
  createdAt: '',
  updatedAt: '',
})

export function WikiLinkMenu(props: WikiLinkMenuProps) {
  const { items, command, query } = props
  const [selected, setSelected] = useState(0)
  const selectedRef = useRef(0)

  const safeItems = useMemo(() => items ?? [], [items])

  const selectedIdx = Math.min(selected, Math.max(0, safeItems.length - 1))

  useEffect(() => {
    selectedRef.current = selectedIdx
  }, [selectedIdx])

  useEffect(() => {
    wikiLinkMenuKeyHandlerRef.current = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelected((s) => {
          const next = Math.min(s + 1, Math.max(0, safeItems.length - 1))
          selectedRef.current = next
          return next
        })
        return true
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setSelected((s) => {
          const next = Math.max(s - 1, 0)
          selectedRef.current = next
          return next
        })
        return true
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        const idx = Math.min(
          selectedRef.current,
          Math.max(0, safeItems.length - 1)
        )
        const it = safeItems[idx]
        if (it) {
          command(it)
          return true
        }
        const q = query.trim()
        if (q) {
          command(syntheticNote(q))
          return true
        }
        return true
      }
      if (event.key === 'Tab') {
        event.preventDefault()
        const idx = Math.min(
          selectedRef.current,
          Math.max(0, safeItems.length - 1)
        )
        const it = safeItems[idx]
        if (it) {
          command(it)
          return true
        }
        const q = query.trim()
        if (q) {
          command(syntheticNote(q))
          return true
        }
        return true
      }
      return false
    }
    return () => {
      wikiLinkMenuKeyHandlerRef.current = null
    }
  }, [command, safeItems])

  return (
    <div
      className={cn(
        toolbarMenuPanelClass,
        'w-[min(100vw-24px,280px)] overflow-hidden p-0'
      )}
    >
      <div className="border-b border-slate-200/40 px-2 pb-1.5 pt-1.5 dark:border-white/[0.06]">
        <p className="text-[11px] font-normal leading-tight text-slate-600/90 dark:text-slate-400/90">
          {props.query ? (
            <>
              <span className="font-mono text-slate-400">[[</span>
              {props.query}
            </>
          ) : (
            <span>Link to a note</span>
          )}
        </p>
      </div>
      <div className="max-h-[min(240px,38vh)] overflow-y-auto overscroll-contain px-0.5 py-0.5">
        {safeItems.length === 0 ? (
          <div className="px-2 py-3 text-center text-[12px] text-slate-500 dark:text-slate-500/90">
            {query.trim() ? (
              <>
                No matching notes —{' '}
                <span className="text-slate-600 dark:text-slate-400">
                  Enter to create “{query.trim()}”
                </span>
              </>
            ) : (
              'No matching notes'
            )}
          </div>
        ) : (
          safeItems.map((note, idx) => {
            const hi = idx === selectedIdx
            return (
              <button
                key={note.id}
                type="button"
                role="option"
                aria-selected={hi}
                className={cn(toolbarMenuItemClass(false, hi), 'gap-2')}
                onMouseEnter={() => {
                  selectedRef.current = idx
                  setSelected(idx)
                }}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => command(note)}
              >
                <span className="min-w-0 flex-1 truncate text-left">
                  {note.title.trim() || 'Untitled'}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

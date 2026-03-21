import { useEffect, useMemo, useRef, useState } from 'react'
import type { SuggestionProps } from '@tiptap/suggestion'
import { cn } from '../../lib/cn'
import { slashMenuKeyHandlerRef } from '../../lib/slashMenuKeyHandler'
import {
  toolbarMenuItemClass,
  toolbarMenuPanelClass,
} from '../ui/selectMenuStyles'
import type { SlashMenuItem } from '../../lib/slashCommandItems'

type SlashCommandMenuProps = SuggestionProps<SlashMenuItem, SlashMenuItem>

export function SlashCommandMenu(props: SlashCommandMenuProps) {
  const { items, command } = props
  const [selected, setSelected] = useState(0)
  const selectedRef = useRef(0)

  const safeItems = useMemo(
    () => (items.length ? items : []),
    [items]
  )

  const selectedIdx = Math.min(
    selected,
    Math.max(0, safeItems.length - 1)
  )

  useEffect(() => {
    selectedRef.current = selectedIdx
  }, [selectedIdx])

  const grouped = useMemo(() => {
    const map = new Map<string, SlashMenuItem[]>()
    for (const it of safeItems) {
      const g = it.group
      if (!map.has(g)) map.set(g, [])
      map.get(g)!.push(it)
    }
    return [...map.entries()]
  }, [safeItems])

  const flatIndex = (item: SlashMenuItem) =>
    Math.max(0, safeItems.findIndex((x) => x.id === item.id))

  useEffect(() => {
    slashMenuKeyHandlerRef.current = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setSelected((s) => {
          const next = Math.min(
            s + 1,
            Math.max(0, safeItems.length - 1)
          )
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
        if (it) command(it)
        return true
      }
      if (event.key === 'Home') {
        event.preventDefault()
        selectedRef.current = 0
        setSelected(0)
        return true
      }
      if (event.key === 'End') {
        event.preventDefault()
        const last = Math.max(0, safeItems.length - 1)
        selectedRef.current = last
        setSelected(last)
        return true
      }
      return false
    }
    return () => {
      slashMenuKeyHandlerRef.current = null
    }
  }, [command, safeItems])

  return (
    <div
      className={cn(
        toolbarMenuPanelClass,
        'w-[min(100vw-24px,260px)] overflow-hidden p-0'
      )}
    >
      <div className="border-b border-slate-200/40 px-2 pb-1.5 pt-1.5 dark:border-white/[0.06]">
        <p className="text-[11px] font-normal leading-tight text-slate-600/90 dark:text-slate-400/90">
          {props.query ? (
            <>
              <span className="text-slate-400">/</span>
              {props.query}
            </>
          ) : (
            <span>Type to filter blocks</span>
          )}
        </p>
      </div>
      <div className="max-h-[min(240px,38vh)] overflow-y-auto overscroll-contain px-0.5 py-0.5">
        {safeItems.length === 0 ? (
          <div className="px-2 py-3 text-center text-[12px] text-slate-500 dark:text-slate-500/90">
            No results
          </div>
        ) : (
          grouped.map(([group, groupItems]) => (
            <div key={group} role="group" aria-label={group}>
              <div className="px-2 pb-0.5 pt-1 text-[9px] font-medium uppercase tracking-[0.08em] text-slate-400/85 first:pt-0.5 dark:text-slate-500/75">
                {group}
              </div>
              {groupItems.map((it) => {
                const idx = flatIndex(it)
                const hi = idx === selectedIdx
                return (
                  <button
                    key={it.id}
                    type="button"
                    role="option"
                    aria-selected={hi}
                    className={cn(toolbarMenuItemClass(false, hi), 'gap-1.5')}
                    onMouseEnter={() => {
                      selectedRef.current = idx
                      setSelected(idx)
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => command(it)}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-slate-100/80 text-[11px] font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300/95">
                      {it.label.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1 text-left">{it.label}</span>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import {
  selectMenuItemClass,
  selectMenuPanelClass,
  selectTriggerBase,
  toolbarMenuItemClass,
  toolbarMenuPanelClass,
} from './selectMenuStyles'

export type SelectMenuOption = {
  value: string
  label: string
  /** Optional section label (first item in a section shows the header). */
  group?: string
  icon?: ReactNode
}

type SelectMenuVariant = 'toolbar' | 'panel' | 'settings'

type SelectMenuProps = {
  value: string
  onChange: (value: string) => void
  options: SelectMenuOption[]
  placeholder?: string
  ariaLabel: string
  id?: string
  disabled?: boolean
  variant?: SelectMenuVariant
  className?: string
  menuMinWidthTrigger?: boolean
  /** Search field at top — use for longer lists (templates, settings). */
  searchable?: boolean
  /** Dense toolbar menus (compact triggers + short rows). */
  compact?: boolean
}

function filterOptions(options: SelectMenuOption[], q: string) {
  const t = q.trim().toLowerCase()
  if (!t) return options
  return options.filter((o) => o.label.toLowerCase().includes(t))
}

function Chevron({ open, className }: { open: boolean; className?: string }) {
  return (
    <svg
      className={cn(
        'shrink-0 text-slate-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] dark:text-slate-500',
        open && '-rotate-180',
        className
      )}
      width={14}
      height={14}
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

export function SelectMenu({
  value,
  onChange,
  options,
  placeholder = 'Select…',
  ariaLabel,
  id,
  disabled,
  variant = 'settings',
  className,
  menuMinWidthTrigger = true,
  searchable = false,
  compact = false,
}: SelectMenuProps) {
  const isToolbarCompact = variant === 'toolbar' && compact
  const uid = useId()
  const listboxId = id ?? `select-menu-${uid}`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const [highlight, setHighlight] = useState(0)
  const [filterQuery, setFilterQuery] = useState('')

  const visibleOptions = useMemo(
    () => (searchable ? filterOptions(options, filterQuery) : options),
    [options, filterQuery, searchable]
  )

  const highlightIdx = Math.min(
    highlight,
    Math.max(0, visibleOptions.length - 1)
  )

  const selectedLabel =
    options.find((o) => o.value === value)?.label ??
    (value === '' ? placeholder : value)

  const readCoords = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = isToolbarCompact ? 4 : 6
    setCoords({
      top: rect.bottom + gap,
      left: rect.left,
      width: rect.width,
    })
  }, [isToolbarCompact])

  const openMenu = useCallback(() => {
    readCoords()
    setFilterQuery('')
    const vo = searchable ? filterOptions(options, '') : options
    const idx = Math.max(0, vo.findIndex((o) => o.value === value))
    setHighlight(idx >= 0 ? idx : 0)
    setIsOpen(true)
    setMounted(true)
    setVisible(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })
  }, [readCoords, options, value, searchable])

  const closeMenu = useCallback(() => {
    setIsOpen(false)
    setVisible(false)
    setFilterQuery('')
  }, [])

  useEffect(() => {
    if (!isOpen) return
    readCoords()
    const onScroll = () => readCoords()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [isOpen, readCoords])

  useEffect(() => {
    if (!isOpen) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target
      if (
        t instanceof Node &&
        !triggerRef.current?.contains(t) &&
        !menuRef.current?.contains(t)
      ) {
        closeMenu()
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [isOpen, closeMenu])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeMenu()
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, closeMenu])

  useEffect(() => {
    if (visible && isOpen && !searchable) {
      menuRef.current?.focus({ preventScroll: true })
    }
  }, [visible, isOpen, searchable])

  useEffect(() => {
    if (visible && isOpen && searchable) {
      searchInputRef.current?.focus({ preventScroll: true })
    }
  }, [visible, isOpen, searchable])

  const handlePanelTransitionEnd = (e: React.TransitionEvent) => {
    if (e.propertyName !== 'opacity') return
    if (!isOpen) setMounted(false)
  }

  const pick = (v: string) => {
    onChange(v)
    closeMenu()
    triggerRef.current?.focus()
  }

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!isOpen) openMenu()
    }
  }

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, Math.max(0, visibleOptions.length - 1)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = visibleOptions[highlightIdx]
      if (o) pick(o.value)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setHighlight(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setHighlight(Math.max(0, visibleOptions.length - 1))
    }
  }

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (searchable) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(h + 1, visibleOptions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setHighlight(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setHighlight(visibleOptions.length - 1)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const o = visibleOptions[highlightIdx]
      if (o) pick(o.value)
    }
  }

  const triggerVariant =
    variant === 'toolbar'
      ? isToolbarCompact
        ? 'h-6 min-h-[1.5rem] rounded-sm border-0 bg-transparent px-1 py-0 pl-1.5 pr-0.5 text-[12px] font-normal leading-none text-slate-600/95 shadow-none transition-colors duration-100 hover:bg-slate-200/40 hover:text-slate-900 dark:text-slate-400/95 dark:hover:bg-white/[0.06] dark:hover:text-slate-100'
        : 'h-7 min-h-[1.75rem] rounded-md border-0 bg-transparent px-1.5 py-1 pl-2 pr-1 text-[13px] font-normal text-slate-500/90 shadow-none transition-colors duration-150 hover:bg-slate-200/30 hover:text-slate-800 dark:text-slate-500/85 dark:hover:bg-white/[0.04] dark:hover:text-slate-100'
      : variant === 'panel'
        ? 'min-h-[2.375rem] w-full rounded-xl px-3 py-2 text-[12px]'
        : 'min-h-[2.5rem] min-w-[10.5rem] rounded-xl px-3 py-2 text-[13px]'

  const showGroupHeaders = visibleOptions.some((o) => o.group)

  const itemClass = (selected: boolean, hi: boolean) =>
    isToolbarCompact ? toolbarMenuItemClass(selected, hi) : selectMenuItemClass(selected, hi)

  const menu =
    mounted &&
    createPortal(
      <div
        ref={menuRef}
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        tabIndex={searchable ? -1 : -1}
        style={{
          position: 'fixed',
          top: coords.top,
          left: coords.left,
          minWidth: menuMinWidthTrigger
            ? coords.width
            : isToolbarCompact
              ? Math.max(coords.width, 140)
              : searchable
                ? 240
                : 200,
          zIndex: 80,
        }}
        onKeyDown={onMenuKeyDown}
        onTransitionEnd={handlePanelTransitionEnd}
        className={cn(
          isToolbarCompact ? toolbarMenuPanelClass : selectMenuPanelClass,
          searchable ? 'px-0 pb-1.5 pt-0' : isToolbarCompact ? 'px-0.5 py-0.5' : 'px-1 py-1.5',
          isToolbarCompact
            ? 'max-h-[min(260px,42dvh)] overflow-y-auto overscroll-contain'
            : 'max-h-[min(360px,56dvh)] overflow-y-auto overscroll-contain',
          'origin-top will-change-transform',
          isToolbarCompact
            ? 'transition-[opacity,transform] duration-150 ease-out'
            : 'transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          visible
            ? 'opacity-100 translate-y-0 scale-100'
            : isToolbarCompact
              ? 'pointer-events-none opacity-0 translate-y-0.5 scale-[0.99]'
              : 'pointer-events-none opacity-0 translate-y-1.5 scale-[0.985]'
        )}
      >
        {searchable ? (
          <div className="sticky top-0 z-[1] border-b border-slate-200/35 bg-[inherit] px-2.5 pb-2 pt-2 dark:border-white/[0.04]">
            <input
              ref={searchInputRef}
              type="search"
              data-shortcut-ignore
              value={filterQuery}
              onChange={(e) => {
                setFilterQuery(e.target.value)
                setHighlight(0)
              }}
              onKeyDown={onSearchKeyDown}
              placeholder="Search…"
              aria-label={`Search ${ariaLabel}`}
              className={cn(
                'w-full rounded-[10px] border border-slate-200/50 bg-white/80 px-2.5 py-1.5 text-[13px]',
                'text-slate-800 placeholder:text-slate-400/80 outline-none transition-shadow duration-150',
                'focus:border-slate-300/60 focus:ring-1 focus:ring-slate-400/12',
                'dark:border-white/[0.06] dark:bg-[#14151c]/90 dark:text-slate-100 dark:placeholder:text-slate-500/90 dark:focus:border-white/[0.1]'
              )}
            />
          </div>
        ) : null}
        <div
          className={cn(
            searchable ? 'px-1 pb-0.5 pt-1' : '',
            isToolbarCompact && !searchable ? 'px-0.5' : ''
          )}
        >
          {visibleOptions.length === 0 ? (
            <div
              className={cn(
                'px-3 text-center text-slate-500 dark:text-slate-500/90',
                isToolbarCompact ? 'py-3 text-[12px]' : 'py-6 text-[13px]'
              )}
            >
              No matches
            </div>
          ) : (
            visibleOptions.map((o, i) => {
              const selected = o.value === value
              const hi = i === highlightIdx
              const prevGroup = i > 0 ? visibleOptions[i - 1]?.group : undefined
              const showHeader =
                showGroupHeaders && o.group && o.group !== prevGroup
              return (
                <div key={o.value || `opt-${i}`}>
                  {showHeader ? (
                    <div
                      className={cn(
                        'font-medium uppercase text-slate-400/85 dark:text-slate-500/75',
                        isToolbarCompact
                          ? 'px-2 pb-0.5 pt-1 text-[9px] tracking-[0.08em] first:pt-0.5'
                          : 'px-3 pb-1 pt-2 text-[10px] tracking-[0.12em] first:pt-1'
                      )}
                      role="presentation"
                    >
                      {o.group}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      itemClass(selected, hi),
                      o.icon != null ? (isToolbarCompact ? 'gap-1.5' : 'gap-2.5') : undefined
                    )}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pick(o.value)}
                  >
                    {o.icon ? (
                      <span
                        className={cn(
                          'flex shrink-0 items-center justify-center rounded-sm text-slate-600 dark:text-slate-300/95',
                          isToolbarCompact
                            ? 'h-5 w-5 bg-slate-100/80 dark:bg-white/[0.06]'
                            : 'h-7 w-7 rounded-lg bg-slate-100/70 dark:bg-white/[0.05]'
                        )}
                      >
                        {o.icon}
                      </span>
                    ) : null}
                    <span className="min-w-0 flex-1 text-left">{o.label}</span>
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>,
      document.body
    )

  return (
    <div className={cn('relative inline-flex min-w-0 max-w-full', className)}>
      <button
        ref={triggerRef}
        type="button"
        id={`${listboxId}-trigger`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={mounted ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return
          if (isOpen) closeMenu()
          else openMenu()
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          variant !== 'toolbar' && selectTriggerBase,
          triggerVariant,
          disabled && 'opacity-50'
        )}
      >
        <span className="min-w-0 flex-1 truncate text-left">{selectedLabel}</span>
        <Chevron
          open={isOpen}
          className={
            variant === 'toolbar'
              ? isToolbarCompact
                ? 'h-2.5 w-2.5'
                : 'h-3 w-3'
              : 'h-3.5 w-3.5'
          }
        />
      </button>
      {menu}
    </div>
  )
}

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'
import { EditorHelpPopover } from '../editor/EditorHelpPopover'
import {
  filterTemplatesByQuery,
  getTemplateMeta,
  getTemplatesByCategory,
  listCategoryOrder,
  SUGGESTED_TEMPLATE_IDS,
  TEMPLATE_CATEGORY_LABELS,
  type TemplateCategoryId,
  type TemplateMeta,
} from '../../lib/templates'
import {
  loadTemplateUsage,
  recordTemplateUse,
  toggleFavoriteTemplate,
  type TemplateUsageState,
} from '../../lib/templateUsage'
import type { NoteTemplateId } from '../../types'
import type {
  NoteTemplateOptions,
  ResearchPaperVariant,
} from '../../lib/templates'
import { selectMenuItemClass, selectMenuPanelClass } from '../ui/selectMenuStyles'

type TemplatePickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchorRef: React.RefObject<HTMLElement | null>
  onSelectTemplate: (id: NoteTemplateId, options?: NoteTemplateOptions) => void
}

export function TemplatePicker({
  open,
  onOpenChange,
  anchorRef,
  onSelectTemplate,
}: TemplatePickerProps) {
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [researchPaperStep, setResearchPaperStep] = useState<
    null | 'choose'
  >(null)
  const [usage, setUsage] = useState<TemplateUsageState>(() =>
    loadTemplateUsage()
  )
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const refreshUsage = useCallback(() => {
    setUsage(loadTemplateUsage())
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    const el = anchorRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pad = 12
    const w = Math.min(300, Math.max(260, window.innerWidth - pad * 2))
    let left = rect.left
    if (left + w > window.innerWidth - pad) {
      left = window.innerWidth - pad - w
    }
    if (left < pad) left = pad
    setCoords({
      top: rect.bottom + 5,
      left,
      width: w,
    })
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    const t = requestAnimationFrame(() => searchRef.current?.focus())
    return () => cancelAnimationFrame(t)
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResearchPaperStep(null)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    const onScroll = (e: Event) => {
      const t = e.target
      if (t instanceof Node && panelRef.current?.contains(t)) return
      onOpenChange(false)
    }
    window.addEventListener('scroll', onScroll, true)
    return () => window.removeEventListener('scroll', onScroll, true)
  }, [open, onOpenChange])

  const suggested = useMemo(
    () => SUGGESTED_TEMPLATE_IDS.map((id) => getTemplateMeta(id)),
    []
  )

  const searchMode = query.trim().length > 0
  const searchResults = useMemo(
    () => filterTemplatesByQuery(query),
    [query]
  )

  const pick = useCallback(
    (id: NoteTemplateId) => {
      if (id === 'research-paper') {
        setResearchPaperStep('choose')
        return
      }
      recordTemplateUse(id)
      refreshUsage()
      onSelectTemplate(id)
      onOpenChange(false)
    },
    [onOpenChange, onSelectTemplate, refreshUsage]
  )

  const confirmResearchPaper = useCallback(
    (variant: ResearchPaperVariant) => {
      recordTemplateUse('research-paper')
      refreshUsage()
      onSelectTemplate('research-paper', { researchPaperVariant: variant })
      onOpenChange(false)
      setResearchPaperStep(null)
    },
    [onOpenChange, onSelectTemplate, refreshUsage]
  )

  const onFavClick = useCallback(
    (e: MouseEvent, id: NoteTemplateId) => {
      e.stopPropagation()
      toggleFavoriteTemplate(id)
      refreshUsage()
    },
    [refreshUsage]
  )

  if (!open) return null

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Dismiss"
        className="fixed inset-0 z-[60] cursor-default bg-transparent"
        onClick={() => onOpenChange(false)}
      />
      <div
        ref={panelRef}
        id={panelId}
        role="dialog"
        aria-label="Templates"
        className={cn(
          selectMenuPanelClass,
          '!py-0',
          'fixed z-[70] flex h-[min(380px,70dvh)] min-h-0 flex-col overflow-hidden',
          'menu-pop-in'
        )}
        style={{
          top: coords.top,
          left: coords.left,
          width: coords.width,
        }}
      >
        <div className="shrink-0 border-b border-slate-200/35 px-2 py-1.5 dark:border-white/[0.05]">
          {researchPaperStep === 'choose' ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setResearchPaperStep(null)}
                className={cn(
                  'shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-slate-600',
                  'transition hover:bg-slate-100/90 hover:text-slate-900',
                  'focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/25',
                  'dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
                )}
              >
                ← Back
              </button>
              <span className="min-w-0 truncate text-[12px] font-semibold text-slate-800 dark:text-slate-200/95">
                Research paper
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <label className="sr-only" htmlFor={`${panelId}-search`}>
                Search templates
              </label>
              <input
                ref={searchRef}
                id={`${panelId}-search`}
                type="search"
                data-shortcut-ignore
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={cn(
                  'min-w-0 flex-1 rounded-md border border-slate-200/55 bg-white/90 px-2 py-1',
                  'text-[12px] text-slate-800 placeholder:text-slate-400/75',
                  'outline-none ring-0 focus:border-sky-400/35 focus:ring-1 focus:ring-sky-500/15',
                  'dark:border-white/[0.07] dark:bg-[#12131a]/90 dark:text-slate-200',
                  'dark:placeholder:text-slate-600/75 dark:focus:border-sky-500/30'
                )}
                autoComplete="off"
                autoCorrect="off"
              />
              <EditorHelpPopover variant="compact" />
            </div>
          )}
        </div>

        <div
          className={cn(
            'picker-panel-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto',
            'px-1.5 py-1.5'
          )}
        >
          {researchPaperStep === 'choose' ? (
            <ResearchPaperVariantPanel onConfirm={confirmResearchPaper} />
          ) : searchMode ? (
            <SearchResultsList
              items={searchResults}
              query={query}
              onPick={pick}
              onFavorite={onFavClick}
              favorites={new Set(usage.favorites)}
            />
          ) : (
            <>
              <RecentAndFavoriteChips
                usage={usage}
                onPick={pick}
                onFavorite={onFavClick}
              />

              <MicroLabel>Suggested</MicroLabel>
              <div className="mb-2.5 grid grid-cols-2 gap-1">
                {suggested.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => pick(m.id)}
                    className={cn(
                      'rounded-md border border-slate-200/45 bg-white/50 px-2 py-1.5 text-left',
                      'text-[11px] font-medium leading-snug text-slate-700 transition',
                      'hover:border-slate-300/70 hover:bg-slate-50/90',
                      'focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/25',
                      'dark:border-white/[0.06] dark:bg-white/[0.02] dark:text-slate-300/95',
                      'dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]'
                    )}
                  >
                    <span className="line-clamp-2">{m.label}</span>
                  </button>
                ))}
              </div>

              <MicroLabel>Browse by category</MicroLabel>
              <div className="space-y-0.5">
                {listCategoryOrder().map((cat) => {
                  const items = getTemplatesByCategory(cat)
                  return (
                    <details
                      key={cat}
                      className="rounded-md border border-transparent open:border-slate-200/40 open:bg-slate-50/50 dark:open:border-white/[0.05] dark:open:bg-white/[0.02]"
                    >
                      <summary
                        className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-[11px] font-medium text-slate-600 outline-none transition hover:bg-slate-100/50 dark:text-slate-500 dark:hover:bg-white/[0.03] [&::-webkit-details-marker]:hidden"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <CategoryMiniIcon id={cat} />
                          <span className="truncate">
                            {TEMPLATE_CATEGORY_LABELS[cat]}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums text-[10px] text-slate-400 dark:text-slate-600">
                          {items.length}
                        </span>
                      </summary>
                      <div className="space-y-px pb-1.5 pl-1 pr-0.5 pt-0.5">
                        {items.map((m) => (
                          <CategoryTemplateRow
                            key={m.id}
                            meta={m}
                            onPick={() => pick(m.id)}
                          />
                        ))}
                      </div>
                    </details>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}

function ResearchPaperVariantPanel({
  onConfirm,
}: {
  onConfirm: (variant: ResearchPaperVariant) => void
}) {
  return (
    <div className="space-y-2 px-0.5 pb-1 pt-0.5">
      <p className="px-1 text-[11px] leading-snug text-slate-500 dark:text-slate-600/90">
        Academic outline with headings, or a LaTeX skeleton in a code block
        (editable plain text).
      </p>
      <button
        type="button"
        onClick={() => onConfirm('standard')}
        className={cn(
          'flex w-full flex-col gap-0.5 rounded-md border border-slate-200/45 bg-white/50 px-2.5 py-2 text-left',
          'transition hover:border-slate-300/70 hover:bg-slate-50/90',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/25',
          'dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]'
        )}
      >
        <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200/95">
          Standard
        </span>
        <span className="text-[10px] leading-snug text-slate-500 dark:text-slate-600/85">
          Topic, thesis, sections, sources
        </span>
      </button>
      <button
        type="button"
        onClick={() => onConfirm('latex')}
        className={cn(
          'flex w-full flex-col gap-0.5 rounded-md border border-slate-200/45 bg-white/50 px-2.5 py-2 text-left',
          'transition hover:border-slate-300/70 hover:bg-slate-50/90',
          'focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/25',
          'dark:border-white/[0.06] dark:bg-white/[0.02] dark:hover:border-white/[0.1] dark:hover:bg-white/[0.04]'
        )}
      >
        <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200/95">
          LaTeX
        </span>
        <span className="text-[10px] leading-snug text-slate-500 dark:text-slate-600/85">
          Pre-filled preamble, sections, bibliography lines
        </span>
      </button>
    </div>
  )
}

function MicroLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400/85 dark:text-slate-600/90">
      {children}
    </div>
  )
}

function RecentAndFavoriteChips({
  usage,
  onPick,
  onFavorite,
}: {
  usage: TemplateUsageState
  onPick: (id: NoteTemplateId) => void
  onFavorite: (e: MouseEvent, id: NoteTemplateId) => void
}) {
  const recent = usage.recent.map((id) => getTemplateMeta(id))
  const favs = usage.favorites.map((id) => getTemplateMeta(id))
  const hasAny = recent.length > 0 || favs.length > 0
  if (!hasAny) return null

  return (
    <div className="mb-2.5 space-y-1.5">
      {recent.length > 0 ? (
        <div>
          <MicroLabel>Recent</MicroLabel>
          <div className="flex flex-wrap gap-1">
            {recent.slice(0, 4).map((m) => (
              <ChipButton key={`r-${m.id}`} label={m.shortLabel} onClick={() => onPick(m.id)} />
            ))}
          </div>
        </div>
      ) : null}
      {favs.length > 0 ? (
        <div>
          <MicroLabel>Pinned</MicroLabel>
          <div className="flex flex-wrap gap-1">
            {favs.map((m) => (
              <span key={`f-${m.id}`} className="group/chip relative inline-flex">
                <ChipButton label={m.shortLabel} onClick={() => onPick(m.id)} />
                <button
                  type="button"
                  title="Unpin"
                  aria-label={`Unpin ${m.label}`}
                  onClick={(e) => onFavorite(e, m.id)}
                  className={cn(
                    'absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full',
                    'border border-slate-200/80 bg-white text-[9px] text-slate-400 opacity-0 shadow-sm',
                    'transition group-hover/chip:opacity-100 hover:text-slate-700',
                    'dark:border-white/[0.12] dark:bg-[#1c1d26] dark:text-slate-500 dark:hover:text-slate-300'
                  )}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ChipButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'max-w-full truncate rounded-full border border-slate-200/50 bg-slate-50/80 px-2 py-0.5',
        'text-[10px] font-medium text-slate-600 transition',
        'hover:border-slate-300/70 hover:bg-white hover:text-slate-800',
        'focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/25',
        'dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-400/95',
        'dark:hover:border-white/[0.12] dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
      )}
    >
      {label}
    </button>
  )
}

function CategoryTemplateRow({
  meta,
  onPick,
}: {
  meta: TemplateMeta
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={cn(
        selectMenuItemClass(false, false),
        'min-h-0 w-full rounded-md px-2 py-1.5 text-[12px] leading-tight'
      )}
    >
      <span className="truncate">{meta.label}</span>
    </button>
  )
}

function SearchResultsList({
  items,
  query,
  onPick,
  onFavorite,
  favorites,
}: {
  items: TemplateMeta[]
  query: string
  onPick: (id: NoteTemplateId) => void
  onFavorite: (e: MouseEvent, id: NoteTemplateId) => void
  favorites: Set<NoteTemplateId>
}) {
  if (items.length === 0) {
    return (
      <p className="px-2 py-5 text-center text-[12px] text-slate-500 dark:text-slate-600/90">
        No match for “{query.trim()}”.
      </p>
    )
  }
  return (
    <div className="space-y-0.5">
      {items.map((m) => (
        <SearchTemplateRow
          key={m.id}
          meta={m}
          onPick={() => onPick(m.id)}
          favorited={favorites.has(m.id)}
          onFavorite={(e) => onFavorite(e, m.id)}
        />
      ))}
    </div>
  )
}

function SearchTemplateRow({
  meta,
  onPick,
  favorited,
  onFavorite,
}: {
  meta: TemplateMeta
  onPick: () => void
  favorited: boolean
  onFavorite: (e: MouseEvent) => void
}) {
  return (
    <div className="group flex items-stretch gap-0.5">
      <button
        type="button"
        role="option"
        onClick={onPick}
        className={cn(
          selectMenuItemClass(false, false),
          'min-h-[2.25rem] flex-1 items-start gap-2 py-1.5'
        )}
      >
        <CategoryGlyphSm category={meta.category} />
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-[12px] leading-tight">
            {meta.label}
          </span>
          {meta.hint ? (
            <span className="mt-0.5 block text-[10px] leading-snug text-slate-500/90 dark:text-slate-600/85">
              {meta.hint}
            </span>
          ) : null}
        </span>
      </button>
      <button
        type="button"
        title={favorited ? 'Unpin' : 'Pin'}
        aria-pressed={favorited}
        onClick={onFavorite}
        className={cn(
          'shrink-0 self-center rounded-md px-1 py-1 text-slate-400 opacity-80 transition',
          'hover:text-amber-600 group-hover:opacity-100',
          'dark:text-slate-600 dark:hover:text-amber-400/95',
          favorited && 'text-amber-600 opacity-100 dark:text-amber-400/90'
        )}
      >
        <StarIcon filled={favorited} />
      </button>
    </div>
  )
}

function CategoryGlyphSm({ category }: { category: TemplateCategoryId }) {
  return (
    <span
      className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-200/45 text-slate-600 dark:bg-white/[0.06] dark:text-slate-500/90"
      aria-hidden
    >
      <CategoryMiniIcon id={category} />
    </span>
  )
}

function CategoryMiniIcon({ id }: { id: TemplateCategoryId }) {
  const cls = 'h-3 w-3'
  switch (id) {
    case 'core':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 4v16M4 12h16"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'research':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 5h6v14H9zM6 9h3M15 9h3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      )
    case 'writing':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 5h12M8 10h8M8 15h12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      )
    default:
      return null
  }
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M12 3.5 14.5 9l6 .5-4.5 3.8 1.4 5.7L12 16.8 6.6 19l1.4-5.7L3.5 9.5l6-.5L12 3.5Z"
        strokeLinejoin="round"
      />
    </svg>
  )
}

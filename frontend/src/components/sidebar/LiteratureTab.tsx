import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { noteIdForReferences, useAppStore } from '../../store'
import { cn } from '../../lib/cn'
import {
  fetchGeminiNoteQueries,
  fetchGeminiPaperRelevance,
  type GeminiNoteQueriesResponse,
  type GeminiPaperRelevanceResponse,
} from '../../lib/geminiApi'
import type { Note, Reference } from '../../types'
import {
  buildAugmentedSearchQuery,
  buildNoteRecommendationSearchQuery,
  CREDIBILITY_HEURISTIC_TOOLTIP,
  estimateCredibility,
  fetchRecommendations,
  plainNoteBodyForApi,
  referenceOpenUrl,
  searchPapers,
  semanticScholarPaperOpenUrl,
  semanticScholarPaperToReference,
  type SemanticScholarPaper,
} from '../../lib/literatureSearch'

type PaperRelevanceCardState = {
  loading: boolean
  error: string | null
  data: GeminiPaperRelevanceResponse | null
}

/** Disambiguates anonymous rows across Recommended / Search results / Similar (same index+title otherwise collided). */
type PaperRelevanceListId = 'rec' | 'res' | 'sim'

function paperRelevanceStateKey(
  list: PaperRelevanceListId,
  p: SemanticScholarPaper,
  listIndex: number
): string {
  const id = p.paperId
  if (typeof id === 'string' && id.trim()) return id.trim()
  const t =
    typeof p.title === 'string' ? p.title.trim().slice(0, 96) : ''
  return `${list}:${listIndex}:${t}`
}

type LiteratureSidebarContextValue = {
  scopeLabel: string
  currentNoteId: string | null
  savedIds: Set<string>
  list: Reference[]
  addReference: (noteId: string | null, reference: Reference) => void
  removeReference: (noteId: string | null, referenceId: string) => void
  literatureDisclosureResetKey: string
  note: Note | undefined
  noteMeaningfulForGemini: boolean
  geminiQueries: GeminiNoteQueriesResponse | null
  geminiQueriesLoading: boolean
  geminiQueriesError: string | null
  onGenerateGeminiQueries: () => void
  noteRecommended: SemanticScholarPaper[]
  noteRecLoading: boolean
  noteRecError: string | null
  noteRecSkipped: boolean
  noteRecEmpty: boolean
  recommendationQuery: string
  recommendedDefaultOpen: boolean
  similarSectionVisible: boolean
  similarDefaultOpen: boolean
  recs: SemanticScholarPaper[]
  similarError: string | null
  busySimilar: boolean
  similarReturnedEmpty: boolean
  onSimilar: (paperId: string) => void
  explainRelevanceEnabled: boolean
  paperRelevanceByKey: Record<string, PaperRelevanceCardState>
  fetchPaperRelevance: (
    paper: SemanticScholarPaper,
    stateKey: string
  ) => void
  query: string
  setQuery: Dispatch<SetStateAction<string>>
  effectiveQuery: string
  onSearch: () => void
  loading: boolean
  searchError: string | null
  results: SemanticScholarPaper[]
  resultsSectionVisible: boolean
  resultsDefaultOpen: boolean
  savedDefaultOpen: boolean
}

const LiteratureSidebarContext =
  createContext<LiteratureSidebarContextValue | null>(null)

function useLiteratureSidebar() {
  const v = useContext(LiteratureSidebarContext)
  if (!v) {
    throw new Error('useLiteratureSidebar requires LiteratureSidebarProvider')
  }
  return v
}

/** Section titles (Search results, Similar, Saved). */
const sectionHeadingClass =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-500/90'

/** Muted helper / empty-state lines in the literature sidebar. */
const mutedLineClass =
  'text-[11px] leading-relaxed text-slate-500 dark:text-slate-600/90'

const alertErrorClass =
  'text-[11px] leading-relaxed text-rose-600 dark:text-rose-400'

/** Debounce before hitting the API when note content changes. */
const NOTE_RECOMMEND_DEBOUNCE_MS = 750
const NOTE_RECOMMEND_RESULT_LIMIT = 8

const noteRecommendSectionHeadingClass =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-800 dark:text-violet-300/90'

/** Shared chrome for Similar + Open on paper cards (compact, keyboard focus). */
const paperCardSecondaryActionClass = cn(
  'inline-flex items-center rounded-lg border border-slate-200/80 px-2 py-1 text-[11px] font-medium text-slate-700 transition',
  'hover:bg-slate-50 dark:border-white/[0.08] dark:text-slate-300 dark:hover:bg-white/[0.04]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
  'dark:focus-visible:ring-sky-400/20'
)

/** Max author names shown before "et al." in sidebar literature UI. */
const AUTHORS_INLINE_MAX = 3

/** Disclosure chrome: compact, keyboard-friendly (native summary). */
const disclosureSummaryClass = cn(
  'flex cursor-pointer list-none items-start gap-1.5 rounded-md py-0.5',
  '-mx-0.5 px-0.5',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30',
  'dark:focus-visible:ring-sky-400/25',
  '[&::-webkit-details-marker]:hidden'
)

function SavingReferencesScopeBanner({
  scopeLabel,
  hint,
}: {
  scopeLabel: string
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="rounded-xl border border-slate-200/55 bg-slate-50/40 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-500/90">
          References for
        </p>
        <p className="mt-0.5 truncate text-[12px] font-medium text-slate-800 dark:text-slate-200/95">
          {scopeLabel}
        </p>
      </div>
      {hint ? (
        <p className="px-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-600/90">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function LiteratureDisclosure({
  headingId,
  title,
  titleClassName,
  resetKey,
  defaultOpen,
  sectionClassName,
  contentDividerClassName,
  summaryDescription,
  children,
}: {
  headingId: string
  title: string
  titleClassName: string
  resetKey: string
  defaultOpen: boolean
  sectionClassName?: string
  contentDividerClassName: string
  summaryDescription?: ReactNode
  children: ReactNode
}) {
  const [userOpen, setUserOpen] = useState<boolean | null>(null)
  useEffect(() => {
    setUserOpen(null)
  }, [resetKey])
  const open = userOpen !== null ? userOpen : defaultOpen

  return (
    <section className={sectionClassName} aria-labelledby={headingId}>
      <details
        open={open}
        onToggle={(e) => setUserOpen(e.currentTarget.open)}
        className="min-w-0"
      >
        <summary className={disclosureSummaryClass}>
          <span
            className={cn(
              'mt-0.5 inline-flex size-4 shrink-0 select-none items-center justify-center',
              'text-[10px] leading-none text-slate-400 tabular-nums dark:text-slate-500'
            )}
            aria-hidden
          >
            {open ? '▾' : '▸'}
          </span>
          <span className="min-w-0 flex-1 text-left">
            <h3 id={headingId} className={titleClassName}>
              {title}
            </h3>
            {summaryDescription ? (
              <div className="mt-0.5">{summaryDescription}</div>
            ) : null}
          </span>
        </summary>
        <div
          className={cn(
            'mt-2 space-y-2 border-t pt-2',
            contentDividerClassName
          )}
        >
          {children}
        </div>
      </details>
    </section>
  )
}

/**
 * Compact author line for narrow sidebar rows. When truncated, `titleAttr` is
 * the full comma-separated list for native tooltip hover.
 */
function formatAuthorsCompact(names: string[]): {
  display: string
  titleAttr: string | undefined
} {
  const list = names.map((n) => n.trim()).filter(Boolean)
  if (list.length === 0) {
    return { display: 'Unknown authors', titleAttr: undefined }
  }
  const full = list.join(', ')
  if (list.length <= AUTHORS_INLINE_MAX) {
    return { display: full, titleAttr: undefined }
  }
  const shown = list.slice(0, AUTHORS_INLINE_MAX).join(', ')
  return {
    display: `${shown} et al.`,
    titleAttr: full,
  }
}

function CredibilityBadge({ value }: { value: number }) {
  const hue =
    value >= 70 ? 'text-emerald-700 dark:text-emerald-400' : value >= 45 ? 'text-amber-700 dark:text-amber-400' : 'text-rose-700 dark:text-rose-400'
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
        'border-slate-200/80 bg-white/80 dark:border-white/[0.08] dark:bg-white/[0.04]',
        hue
      )}
      title={CREDIBILITY_HEURISTIC_TOOLTIP}
    >
      {value}
    </span>
  )
}

const paperRelevanceSectionLabelClass =
  'text-[10px] font-semibold uppercase tracking-wide text-sky-700/90 dark:text-sky-400/85'

function PaperCard({
  paper,
  savedIds,
  onSave,
  onSimilar,
  busySimilar,
  recommendedTone = false,
  explainRelevanceEnabled = false,
  paperRelevance,
  onExplainRelevance = () => {},
}: {
  paper: SemanticScholarPaper
  savedIds: Set<string>
  onSave: (r: Reference) => void
  onSimilar: (paperId: string) => void
  busySimilar: boolean
  recommendedTone?: boolean
  explainRelevanceEnabled?: boolean
  paperRelevance?: PaperRelevanceCardState | undefined
  onExplainRelevance?: () => void
}) {
  const [abstractOpen, setAbstractOpen] = useState(false)
  const ref = semanticScholarPaperToReference(paper)
  const id = paper.paperId
  const title = typeof paper.title === 'string' ? paper.title : 'Untitled'
  const authorNames = (paper.authors ?? [])
    .map((a) => (typeof a === 'string' ? a : a?.name ?? ''))
    .filter(Boolean)
  const { display: authorsDisplay, titleAttr: authorsTitle } =
    formatAuthorsCompact(authorNames)
  const year = typeof paper.year === 'number' ? String(paper.year) : '—'
  const cc =
    typeof paper.citationCount === 'number' ? paper.citationCount : undefined
  const abstractFull =
    typeof paper.abstract === 'string' && paper.abstract.trim().length > 0
      ? paper.abstract.trim()
      : ''
  const cred = estimateCredibility(paper)
  const saved = id ? savedIds.has(id) : false
  const openHref = semanticScholarPaperOpenUrl(paper)

  return (
    <article
      className={cn(
        'rounded-xl border p-3',
        recommendedTone
          ? 'border-violet-200/60 bg-violet-50/40 dark:border-violet-900/35 dark:bg-violet-950/20'
          : 'border-slate-200/60 bg-white/60 dark:border-white/[0.06] dark:bg-white/[0.02]'
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="min-w-0 flex-1 text-[12px] font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {title}
        </h4>
        <CredibilityBadge value={cred} />
      </div>
      <p className="mt-1 min-w-0 text-[11px] text-slate-500 dark:text-slate-500/90">
        <span
          className={cn(authorsTitle && 'cursor-default')}
          title={authorsTitle}
        >
          {authorsDisplay}
        </span>
        {' · '}
        {year}
        {cc != null ? ` · ${cc} citations` : null}
        {paper.venue ? ` · ${paper.venue}` : null}
      </p>
      {abstractFull ? (
        <div className="mt-2 min-w-0">
          <button
            type="button"
            onClick={() => setAbstractOpen((o) => !o)}
            className={cn(
              'text-left text-[10px] font-medium text-sky-700 hover:underline',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30',
              'dark:text-sky-400/90 dark:focus-visible:ring-sky-400/25'
            )}
            aria-expanded={abstractOpen}
          >
            {abstractOpen ? 'Hide abstract' : 'Show abstract'}
          </button>
          {abstractOpen ? (
            <p
              className={cn(
                'mt-1.5 max-h-40 min-h-0 overflow-y-auto text-pretty text-[11px] leading-relaxed',
                'text-slate-600 dark:text-slate-600/90'
              )}
            >
              {abstractFull}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!ref || saved}
          onClick={() => ref && onSave(ref)}
          className={cn(
            'rounded-lg border px-2 py-1 text-[11px] font-medium transition',
            saved
              ? 'cursor-default border-slate-200/60 text-slate-400 dark:border-white/[0.06]'
              : 'border-sky-200/80 text-sky-800 hover:bg-sky-50 dark:border-sky-900/40 dark:text-sky-300 dark:hover:bg-sky-950/40'
          )}
        >
          {saved ? 'Saved' : 'Save to note'}
        </button>
        {id ? (
          <button
            type="button"
            disabled={busySimilar}
            onClick={() => onSimilar(id)}
            className={cn(
              paperCardSecondaryActionClass,
              busySimilar && 'opacity-50'
            )}
          >
            Similar
          </button>
        ) : null}
        {openHref ? (
          <a
            href={openHref}
            target="_blank"
            rel="noopener noreferrer"
            className={paperCardSecondaryActionClass}
          >
            Open
          </a>
        ) : null}
        {explainRelevanceEnabled ? (
          <button
            type="button"
            title="Uses the open note's title and plain-text body plus this paper's metadata (backend calls Gemini)."
            disabled={Boolean(paperRelevance?.loading)}
            onClick={onExplainRelevance}
            className={cn(
              'rounded-lg border border-sky-200/80 px-2 py-1 text-[11px] font-medium text-sky-800 transition',
              'hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50',
              'dark:border-sky-900/40 dark:text-sky-300 dark:hover:bg-sky-950/40',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30',
              'dark:focus-visible:ring-sky-400/25'
            )}
          >
            {paperRelevance?.loading ? 'Explaining…' : 'Explain relevance to note'}
          </button>
        ) : null}
      </div>
      {explainRelevanceEnabled &&
      paperRelevance &&
      (paperRelevance.loading ||
        paperRelevance.error != null ||
        paperRelevance.data != null) ? (
        <div className="mt-2 min-w-0 border-t border-slate-200/55 pt-2 dark:border-white/[0.06]">
          {paperRelevance.loading ? (
            <p className={mutedLineClass}>Explaining relevance…</p>
          ) : null}
          {paperRelevance.error ? (
            <p className={alertErrorClass} role="alert">
              <span className="font-semibold">Explanation failed.</span>{' '}
              {paperRelevance.error}
            </p>
          ) : null}
          {paperRelevance.data ? (
            <details className="min-w-0">
              <summary className="cursor-pointer text-[10px] font-medium text-sky-800 hover:underline dark:text-sky-300/95">
                AI relevance details
              </summary>
              <div className="mt-2 space-y-2 pl-5">
                <div>
                  <p className={paperRelevanceSectionLabelClass}>Summary</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {paperRelevance.data.summary.trim() || '—'}
                  </p>
                </div>
                <div>
                  <p className={paperRelevanceSectionLabelClass}>Relevance</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {paperRelevance.data.relevance.trim() || '—'}
                  </p>
                </div>
                <div>
                  <p className={paperRelevanceSectionLabelClass}>Methods</p>
                  <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {paperRelevance.data.methods.length > 0
                      ? paperRelevance.data.methods.map((m, i) => (
                          <li key={`m-${i}`} className="break-words">
                            {m}
                          </li>
                        ))
                      : (
                          <li className="text-slate-500 dark:text-slate-500">—</li>
                        )}
                  </ul>
                </div>
                <div>
                  <p className={paperRelevanceSectionLabelClass}>Limitations</p>
                  <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {paperRelevance.data.limitations.length > 0
                      ? paperRelevance.data.limitations.map((x, i) => (
                          <li key={`lim-${i}`} className="break-words">
                            {x}
                          </li>
                        ))
                      : (
                          <li className="text-slate-500 dark:text-slate-500">—</li>
                        )}
                  </ul>
                </div>
                <div>
                  <p className={paperRelevanceSectionLabelClass}>Use in writing</p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    {paperRelevance.data.useInWriting.trim() || '—'}
                  </p>
                </div>
              </div>
            </details>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}

export function LiteratureSidebarProvider({ children }: { children: ReactNode }) {
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const notes = useAppStore((s) => s.notes)
  const referencesByNoteId = useAppStore((s) => s.referencesByNoteId)
  const addReference = useAppStore((s) => s.addReference)
  const removeReference = useAppStore((s) => s.removeReference)

  const note = useMemo(
    () => notes.find((n) => n.id === currentNoteId),
    [notes, currentNoteId]
  )

  const list = useMemo(() => {
    const k = noteIdForReferences(currentNoteId)
    return referencesByNoteId[k] ?? []
  }, [referencesByNoteId, currentNoteId])

  const savedIds = useMemo(
    () => new Set(list.map((r) => r.id)),
    [list]
  )

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticScholarPaper[]>([])
  const [recs, setRecs] = useState<SemanticScholarPaper[]>([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [similarError, setSimilarError] = useState<string | null>(null)
  /** Last search finished OK and API returned zero papers. */
  const [searchReturnedEmpty, setSearchReturnedEmpty] = useState(false)
  /** Last similar fetch finished OK and API returned zero papers. */
  const [similarReturnedEmpty, setSimilarReturnedEmpty] = useState(false)
  const [busySimilar, setBusySimilar] = useState(false)

  const [noteRecommended, setNoteRecommended] = useState<SemanticScholarPaper[]>(
    []
  )
  const [noteRecLoading, setNoteRecLoading] = useState(false)
  const [noteRecError, setNoteRecError] = useState<string | null>(null)
  const [noteRecSkipped, setNoteRecSkipped] = useState(true)
  const [noteRecEmpty, setNoteRecEmpty] = useState(false)

  const [geminiQueries, setGeminiQueries] =
    useState<GeminiNoteQueriesResponse | null>(null)
  const [geminiQueriesLoading, setGeminiQueriesLoading] = useState(false)
  const [geminiQueriesError, setGeminiQueriesError] = useState<string | null>(
    null
  )

  const [paperRelevanceByKey, setPaperRelevanceByKey] = useState<
    Record<string, PaperRelevanceCardState>
  >({})

  /**
   * Fingerprint of the note text sent to Gemini; stale in-flight responses are
   * ignored after note switch or edits (same id, new body).
   */
  const geminiNoteContextRef = useRef('')
  geminiNoteContextRef.current = note
    ? `${note.id}\0${note.title}\0${plainNoteBodyForApi(note)}\0${String(note.editorMode ?? 'rich')}`
    : ''

  useEffect(() => {
    setGeminiQueries(null)
    setGeminiQueriesError(null)
    setGeminiQueriesLoading(false)
    setPaperRelevanceByKey({})
  }, [note?.id, note?.title, note?.content, note?.editorMode])

  useEffect(() => {
    let cancelled = false

    if (!note) {
      setNoteRecommended([])
      setNoteRecLoading(false)
      setNoteRecError(null)
      setNoteRecSkipped(true)
      setNoteRecEmpty(false)
      return
    }

    const q = buildNoteRecommendationSearchQuery(note)
    if (!q) {
      setNoteRecommended([])
      setNoteRecLoading(false)
      setNoteRecError(null)
      setNoteRecSkipped(true)
      setNoteRecEmpty(false)
      return
    }

    setNoteRecSkipped(false)
    setNoteRecLoading(true)
    setNoteRecError(null)
    setNoteRecEmpty(false)
    setNoteRecommended([])

    const tid = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await searchPapers(q, NOTE_RECOMMEND_RESULT_LIMIT)
          if (cancelled) return
          const data = res.data ?? []
          setNoteRecommended(data)
          setNoteRecEmpty(data.length === 0)
        } catch (e) {
          if (cancelled) return
          setNoteRecError(
            e instanceof Error ? e.message : 'Failed to load recommendations.'
          )
          setNoteRecommended([])
          setNoteRecEmpty(false)
        } finally {
          if (!cancelled) setNoteRecLoading(false)
        }
      })()
    }, NOTE_RECOMMEND_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(tid)
      setNoteRecLoading(false)
    }
  }, [note?.id, note?.title, note?.content, note?.editorMode])

  const recommendationQuery = useMemo(
    () => buildNoteRecommendationSearchQuery(note),
    [note]
  )

  /** Enough title/body for Gemini note-queries (independent of recommendation tokens). */
  const noteMeaningfulForGemini = useMemo(() => {
    if (!note) return false
    const title = note.title.trim()
    const body = plainNoteBodyForApi(note).trim()
    if (title.length >= 3) return true
    if (body.length >= 40) return true
    return false
  }, [note])

  const effectiveQuery = useMemo(() => {
    if (!note) return query.trim()
    return buildAugmentedSearchQuery(query, note)
  }, [query, note])

  const onSearch = useCallback(async () => {
    setSearchError(null)
    setSimilarError(null)
    setSearchReturnedEmpty(false)
    setSimilarReturnedEmpty(false)
    setRecs([])
    setLoading(true)
    try {
      const res = await searchPapers(effectiveQuery, 15)
      const data = res.data ?? []
      setResults(data)
      setSearchReturnedEmpty(data.length === 0)
    } catch (e) {
      setSearchError(
        e instanceof Error ? e.message : 'Unexpected error while searching.'
      )
      setResults([])
      setSearchReturnedEmpty(false)
    } finally {
      setLoading(false)
    }
  }, [effectiveQuery])

  const onSimilar = useCallback(async (paperId: string) => {
    setBusySimilar(true)
    setSimilarError(null)
    setSimilarReturnedEmpty(false)
    try {
      const papers = await fetchRecommendations(paperId, 10)
      setRecs(papers)
      setSimilarReturnedEmpty(papers.length === 0)
    } catch (e) {
      setSimilarError(
        e instanceof Error
          ? e.message
          : 'Unexpected error while loading similar papers.'
      )
      setRecs([])
      setSimilarReturnedEmpty(false)
    } finally {
      setBusySimilar(false)
    }
  }, [])

  const onGenerateGeminiQueries = useCallback(async () => {
    if (!note || !noteMeaningfulForGemini) return
    const startedCtx = geminiNoteContextRef.current
    setGeminiQueriesError(null)
    setGeminiQueriesLoading(true)
    try {
      const data = await fetchGeminiNoteQueries({
        noteTitle: note.title.trim(),
        noteContent: plainNoteBodyForApi(note),
      })
      if (geminiNoteContextRef.current !== startedCtx) return
      setGeminiQueries(data)
    } catch (e) {
      if (geminiNoteContextRef.current !== startedCtx) return
      setGeminiQueries(null)
      setGeminiQueriesError(
        e instanceof Error ? e.message : 'Could not generate queries.'
      )
    } finally {
      if (geminiNoteContextRef.current === startedCtx) {
        setGeminiQueriesLoading(false)
      }
    }
  }, [note, noteMeaningfulForGemini])

  const explainRelevanceEnabled = Boolean(note && noteMeaningfulForGemini)

  const fetchPaperRelevance = useCallback(
    async (paper: SemanticScholarPaper, stateKey: string) => {
      if (!note || !noteMeaningfulForGemini) return
      const startedCtx = geminiNoteContextRef.current
      const snapshotTitle = note.title.trim()
      const snapshotBody = plainNoteBodyForApi(note)
      setPaperRelevanceByKey((prev) => ({
        ...prev,
        [stateKey]: {
          loading: true,
          error: null,
          data: prev[stateKey]?.data ?? null,
        },
      }))
      try {
        const data = await fetchGeminiPaperRelevance({
          noteTitle: snapshotTitle,
          noteContent: snapshotBody,
          paper,
        })
        if (geminiNoteContextRef.current !== startedCtx) return
        setPaperRelevanceByKey((prev) => ({
          ...prev,
          [stateKey]: {
            loading: false,
            error: null,
            data,
          },
        }))
      } catch (e) {
        if (geminiNoteContextRef.current !== startedCtx) return
        setPaperRelevanceByKey((prev) => ({
          ...prev,
          [stateKey]: {
            loading: false,
            error:
              e instanceof Error ? e.message : 'Could not explain relevance.',
            data: null,
          },
        }))
      }
    },
    [note, noteMeaningfulForGemini]
  )

  const scopeLabel = note?.title?.trim() || 'No note selected'

  const literatureDisclosureResetKey = currentNoteId ?? ''

  const recommendedDefaultOpen =
    !note ||
    noteRecSkipped ||
    noteRecLoading ||
    noteRecError != null ||
    noteRecEmpty ||
    noteRecommended.length > 0

  const resultsSectionVisible =
    results.length > 0 ||
    (searchReturnedEmpty && !loading && !searchError)

  const resultsDefaultOpen =
    results.length > 0 || searchReturnedEmpty

  const similarSectionVisible =
    recs.length > 0 ||
    similarError != null ||
    similarReturnedEmpty ||
    busySimilar

  const similarDefaultOpen =
    busySimilar ||
    similarError != null ||
    similarReturnedEmpty ||
    recs.length > 0

  const savedDefaultOpen = list.length > 0

  const literatureSidebarValue: LiteratureSidebarContextValue = {
    scopeLabel,
    currentNoteId,
    savedIds,
    list,
    addReference,
    removeReference,
    literatureDisclosureResetKey,
    note,
    noteMeaningfulForGemini,
    geminiQueries,
    geminiQueriesLoading,
    geminiQueriesError,
    onGenerateGeminiQueries,
    noteRecommended,
    noteRecLoading,
    noteRecError,
    noteRecSkipped,
    noteRecEmpty,
    recommendationQuery,
    recommendedDefaultOpen,
    similarSectionVisible,
    similarDefaultOpen,
    recs,
    similarError,
    busySimilar,
    similarReturnedEmpty,
    onSimilar,
    explainRelevanceEnabled,
    paperRelevanceByKey,
    fetchPaperRelevance,
    query,
    setQuery,
    effectiveQuery,
    onSearch,
    loading,
    searchError,
    results,
    resultsSectionVisible,
    resultsDefaultOpen,
    savedDefaultOpen,
  }

  return (
    <LiteratureSidebarContext.Provider value={literatureSidebarValue}>
      {children}
    </LiteratureSidebarContext.Provider>
  )
}

export function ExploreTab() {
  const {
    scopeLabel,
    currentNoteId,
    savedIds,
    list,
    addReference,
    removeReference,
    literatureDisclosureResetKey,
    note,
    noteMeaningfulForGemini,
    geminiQueries,
    geminiQueriesLoading,
    geminiQueriesError,
    onGenerateGeminiQueries,
    noteRecommended,
    noteRecLoading,
    noteRecError,
    noteRecSkipped,
    noteRecEmpty,
    recommendationQuery,
    recommendedDefaultOpen,
    similarSectionVisible,
    similarDefaultOpen,
    recs,
    similarError,
    busySimilar,
    similarReturnedEmpty,
    onSimilar,
    explainRelevanceEnabled,
    paperRelevanceByKey,
    fetchPaperRelevance,
    savedDefaultOpen,
  } = useLiteratureSidebar()

  const geminiIdeasDefaultOpen =
    geminiQueriesLoading ||
    geminiQueriesError != null ||
    geminiQueries != null

  const geminiIdeasResetKey = `${literatureDisclosureResetKey}\0gq:${geminiQueriesLoading}:${Boolean(geminiQueriesError)}:${Boolean(geminiQueries)}`

  return (
    <div className="space-y-4 pt-1">
      <SavingReferencesScopeBanner
        scopeLabel={scopeLabel}
        hint="Note-driven discovery. Keyword lookup lives on Search."
      />

      <LiteratureDisclosure
        headingId="explore-gemini-queries-heading"
        title="AI QUERY IDEAS"
        titleClassName="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-800 dark:text-emerald-300/90"
        resetKey={geminiIdeasResetKey}
        defaultOpen={geminiIdeasDefaultOpen}
        sectionClassName={cn(
          'rounded-xl border border-emerald-200/60 bg-emerald-50/30 px-3 py-2.5',
          'dark:border-emerald-900/35 dark:bg-emerald-950/20'
        )}
        contentDividerClassName="border-emerald-200/50 dark:border-emerald-900/30"
        summaryDescription={
          <p className="text-[10px] leading-snug text-emerald-800/80 dark:text-emerald-400/75">
            Gemini from this note’s title and body—tap Generate when open (not
            automatic).
          </p>
        }
      >
        <button
          type="button"
          onClick={() => void onGenerateGeminiQueries()}
          disabled={!noteMeaningfulForGemini || geminiQueriesLoading}
          className={cn(
            'rounded-lg border border-emerald-200/80 bg-white/70 px-2.5 py-1.5 text-[11px] font-medium',
            'text-emerald-900 hover:bg-emerald-50/90 disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-950/50',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30',
            'dark:focus-visible:ring-emerald-400/25'
          )}
        >
          {geminiQueriesLoading ? 'Generating…' : 'Generate queries from note'}
        </button>
        {!note ? (
          <p className={mutedLineClass}>Open a note to use this.</p>
        ) : !noteMeaningfulForGemini ? (
          <p className={mutedLineClass}>
            Add a title (3+ characters) or more body text (40+ characters) to
            enable.
          </p>
        ) : null}
        {geminiQueriesLoading ? (
          <p className={mutedLineClass}>Generating ideas…</p>
        ) : null}
        {geminiQueriesError ? (
          <p className={alertErrorClass} role="alert">
            <span className="font-semibold">Query generation failed.</span>{' '}
            {geminiQueriesError}
          </p>
        ) : null}
        {geminiQueries && !geminiQueriesLoading ? (
          <div
            className={cn(
              'space-y-2 border-t border-emerald-200/50 pt-2',
              'dark:border-emerald-900/30'
            )}
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90 dark:text-emerald-500/90">
                Main topic
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                {geminiQueries.mainTopic.trim() || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90 dark:text-emerald-500/90">
                Refined question
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                {geminiQueries.refinedQuestion.trim() || '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90 dark:text-emerald-500/90">
                Suggested queries
              </p>
              <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                {geminiQueries.suggestedQueries.length > 0
                  ? geminiQueries.suggestedQueries.map((q, i) => (
                      <li key={`gq-${i}`} className="break-words">
                        {q}
                      </li>
                    ))
                  : (
                      <li className="text-slate-500 dark:text-slate-500">—</li>
                    )}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700/90 dark:text-emerald-500/90">
                Missing angles
              </p>
              <ul className="mt-0.5 list-inside list-disc space-y-0.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                {geminiQueries.missingAngles.length > 0
                  ? geminiQueries.missingAngles.map((a, i) => (
                      <li key={`ma-${i}`} className="break-words">
                        {a}
                      </li>
                    ))
                  : (
                      <li className="text-slate-500 dark:text-slate-500">—</li>
                    )}
              </ul>
            </div>
          </div>
        ) : null}
      </LiteratureDisclosure>

      <LiteratureDisclosure
        headingId="literature-note-recommended-heading"
        title="Recommended for this note"
        titleClassName={noteRecommendSectionHeadingClass}
        resetKey={literatureDisclosureResetKey}
        defaultOpen={recommendedDefaultOpen}
        sectionClassName={cn(
          'rounded-xl border border-violet-200/65 bg-violet-50/40 px-3 py-2.5',
          'dark:border-violet-900/40 dark:bg-violet-950/25'
        )}
        contentDividerClassName="border-violet-200/50 dark:border-violet-900/35"
        summaryDescription={
          <p className="text-[10px] leading-snug text-violet-700/85 dark:text-violet-400/75">
            Debounced from this note. Ignores Search’s query/blend. Different from
            Similar papers.
          </p>
        }
      >
        {recommendationQuery && !noteRecSkipped ? (
          <p
            className="text-[10px] leading-snug text-slate-500 dark:text-slate-600/90"
            title={recommendationQuery}
          >
            <span className="text-slate-500/85 dark:text-slate-600/80">
              Based on:
            </span>{' '}
            <span className="break-words text-slate-600/95 dark:text-slate-500/90">
              {recommendationQuery}
            </span>
          </p>
        ) : null}
        {!note ? (
          <p className={mutedLineClass}>
            Open a note to load suggestions.
          </p>
        ) : noteRecSkipped ? (
          <p className={mutedLineClass}>
            Not enough specific terms in the note for auto suggestions. Add
            distinctive keywords or a longer excerpt.
          </p>
        ) : noteRecLoading ? (
          <p className={mutedLineClass}>Loading recommendations…</p>
        ) : noteRecError ? (
          <p className={alertErrorClass} role="alert">
            <span className="font-semibold">Recommendations failed.</span>{' '}
            {noteRecError}
          </p>
        ) : noteRecEmpty ? (
          <p className={mutedLineClass}>
            No papers matched the terms derived from this note.
          </p>
        ) : (
          <div className="space-y-2">
            {noteRecommended.map((p, i) => {
              const relKey = paperRelevanceStateKey('rec', p, i)
              return (
                <PaperCard
                  key={p.paperId ?? `note-rec-${i}-${p.title ?? ''}`}
                  paper={p}
                  savedIds={savedIds}
                  recommendedTone
                  onSave={(r) => addReference(currentNoteId, r)}
                  onSimilar={onSimilar}
                  busySimilar={busySimilar}
                  explainRelevanceEnabled={explainRelevanceEnabled}
                  paperRelevance={paperRelevanceByKey[relKey]}
                  onExplainRelevance={() => void fetchPaperRelevance(p, relKey)}
                />
              )
            })}
          </div>
        )}
      </LiteratureDisclosure>

      {similarSectionVisible ? (
        <LiteratureDisclosure
          headingId="literature-similar-heading"
          title="Similar papers"
          titleClassName={sectionHeadingClass}
          resetKey={literatureDisclosureResetKey}
          defaultOpen={similarDefaultOpen}
          contentDividerClassName="border-slate-200/55 dark:border-white/[0.06]"
          summaryDescription={
            <p className="text-[10px] leading-snug text-slate-500 dark:text-slate-600/90">
              From <span className="font-medium">Similar</span> on a card—not from
              the note body or Search keywords.
            </p>
          }
        >
          {similarError ? (
            <p className={alertErrorClass} role="alert">
              <span className="font-semibold">Similar-paper fetch failed.</span>{' '}
              {similarError}
            </p>
          ) : busySimilar ? (
            <p className={mutedLineClass}>Loading similar papers…</p>
          ) : recs.length > 0 ? (
            <div className="space-y-2">
              {recs.map((p, i) => {
                const relKey = paperRelevanceStateKey('sim', p, i)
                return (
                  <PaperCard
                    key={p.paperId ?? `rec-${i}`}
                    paper={p}
                    savedIds={savedIds}
                    onSave={(r) => addReference(currentNoteId, r)}
                    onSimilar={onSimilar}
                    busySimilar={busySimilar}
                    explainRelevanceEnabled={explainRelevanceEnabled}
                    paperRelevance={paperRelevanceByKey[relKey]}
                    onExplainRelevance={() => void fetchPaperRelevance(p, relKey)}
                  />
                )
              })}
            </div>
          ) : similarReturnedEmpty ? (
            <p className={mutedLineClass}>
              No close matches for that paper.
            </p>
          ) : null}
        </LiteratureDisclosure>
      ) : null}

      <LiteratureDisclosure
        headingId="literature-saved-heading"
        title="Saved for this note"
        titleClassName={sectionHeadingClass}
        resetKey={literatureDisclosureResetKey}
        defaultOpen={savedDefaultOpen}
        contentDividerClassName="border-slate-200/55 dark:border-white/[0.06]"
      >
        {list.length === 0 ? (
          <p className={mutedLineClass}>
            <span className="font-medium text-slate-600 dark:text-slate-500/95">
              No saved references for this note.
            </span>{' '}
            Save from Search results, recommendations, or Similar.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((r) => {
              const { display: savedAuthors, titleAttr: savedAuthorsTitle } =
                formatAuthorsCompact(r.authors)
              return (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-2 rounded-lg border border-slate-200/50 bg-white/40 px-2.5 py-2 dark:border-white/[0.05] dark:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium leading-snug text-slate-800 dark:text-slate-200/95">
                      {r.title}
                    </p>
                    <p
                      className={cn(
                        'mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-600/90',
                        savedAuthorsTitle && 'cursor-default'
                      )}
                      title={savedAuthorsTitle}
                    >
                      {savedAuthors}
                      {' · '}
                      {r.year}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <CredibilityBadge value={r.credibility} />
                    <a
                      href={referenceOpenUrl(r)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'text-[10px] font-medium text-slate-600 hover:underline',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
                        'dark:text-slate-400 dark:focus-visible:ring-sky-400/20'
                      )}
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => removeReference(currentNoteId, r.id)}
                      className="text-[10px] font-medium text-rose-600 hover:underline dark:text-rose-400"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </LiteratureDisclosure>
    </div>
  )
}

export function SearchTab() {
  const {
    scopeLabel,
    query,
    setQuery,
    effectiveQuery,
    onSearch,
    loading,
    searchError,
    results,
    resultsSectionVisible,
    resultsDefaultOpen,
    literatureDisclosureResetKey,
    savedIds,
    currentNoteId,
    addReference,
    onSimilar,
    busySimilar,
    explainRelevanceEnabled,
    paperRelevanceByKey,
    fetchPaperRelevance,
  } = useLiteratureSidebar()

  return (
    <div className="space-y-4 pt-1">
      <SavingReferencesScopeBanner
        scopeLabel={scopeLabel}
        hint="Direct paper lookup. AI ideas and auto-recs stay on Explore."
      />

      <section className="space-y-2.5">
        <div>
          <label
            htmlFor="sidebar-paper-search-input"
            className="block text-[11px] font-semibold text-slate-700 dark:text-slate-400/95"
          >
            Paper search
          </label>
          <p
            id="sidebar-paper-search-hint"
            className="mt-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-600/90"
          >
            Enter or click Search—queries Semantic Scholar when you run it.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="sidebar-paper-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void onSearch()}
            placeholder="Keywords, title, author…"
            className={cn(
              'min-w-0 flex-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1.5 text-[12px]',
              'text-slate-900 placeholder:text-slate-400',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
              'dark:border-white/[0.08] dark:bg-[#1a1b22] dark:text-slate-100 dark:placeholder:text-slate-600'
            )}
            aria-describedby="sidebar-paper-search-hint"
          />
          <button
            type="button"
            onClick={() => void onSearch()}
            disabled={loading || !effectiveQuery.trim()}
            className={cn(
              'shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-[12px] font-medium text-white',
              'hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50',
              'dark:bg-sky-600/90 dark:hover:bg-sky-500'
            )}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        {searchError ? (
          <p className={alertErrorClass} role="alert">
            <span className="font-semibold">Search failed.</span>{' '}
            {searchError}
          </p>
        ) : null}
      </section>

      {resultsSectionVisible ? (
        <LiteratureDisclosure
          headingId="search-paper-results-heading"
          title="Search results"
          titleClassName={sectionHeadingClass}
          resetKey={literatureDisclosureResetKey}
          defaultOpen={resultsDefaultOpen}
          contentDividerClassName="border-slate-200/55 dark:border-white/[0.06]"
        >
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((p, i) => {
                const relKey = paperRelevanceStateKey('res', p, i)
                return (
                  <PaperCard
                    key={p.paperId ?? `res-${i}-${p.title ?? ''}`}
                    paper={p}
                    savedIds={savedIds}
                    onSave={(r) => addReference(currentNoteId, r)}
                    onSimilar={onSimilar}
                    busySimilar={busySimilar}
                    explainRelevanceEnabled={explainRelevanceEnabled}
                    paperRelevance={paperRelevanceByKey[relKey]}
                    onExplainRelevance={() => void fetchPaperRelevance(p, relKey)}
                  />
                )
              })}
            </div>
          ) : (
            <p className={mutedLineClass}>
              No matches for this search. Try other keywords.
            </p>
          )}
        </LiteratureDisclosure>
      ) : null}
    </div>
  )
}

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { noteIdForReferences, useAppStore } from '../../store'
import { cn } from '../../lib/cn'
import type { Reference } from '../../types'
import {
  buildAugmentedSearchQuery,
  buildNoteRecommendationSearchQuery,
  CREDIBILITY_HEURISTIC_TOOLTIP,
  estimateCredibility,
  fetchRecommendations,
  NOTE_CONTEXT_BODY_WORDS,
  NOTE_CONTEXT_TITLE_WORDS,
  referenceOpenUrl,
  searchPapers,
  semanticScholarPaperOpenUrl,
  semanticScholarPaperToReference,
  type SemanticScholarPaper,
} from '../../lib/literatureSearch'

/** Section titles (manual results, Similar, Saved). */
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

function PaperCard({
  paper,
  savedIds,
  onSave,
  onSimilar,
  busySimilar,
  recommendedTone = false,
}: {
  paper: SemanticScholarPaper
  savedIds: Set<string>
  onSave: (r: Reference) => void
  onSimilar: (paperId: string) => void
  busySimilar: boolean
  recommendedTone?: boolean
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
      </div>
    </article>
  )
}

export function LiteratureTab() {
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
  const [useNoteContext, setUseNoteContext] = useState(true)
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

  const effectiveQuery = useMemo(() => {
    if (!useNoteContext || !note) return query.trim()
    return buildAugmentedSearchQuery(query, note)
  }, [query, useNoteContext, note])

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

  return (
    <div className="space-y-5 pt-1">
      <div className="rounded-xl border border-slate-200/55 bg-slate-50/40 px-3 py-2.5 dark:border-white/[0.06] dark:bg-white/[0.02]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-500/90">
          Saving references to
        </p>
        <p className="mt-0.5 truncate text-[12px] font-medium text-slate-800 dark:text-slate-200/95">
          {scopeLabel}
        </p>
      </div>

      <section className="space-y-2">
        <div>
          <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-500/95">
            Manual search
          </label>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500 dark:text-slate-600/90">
            Type keywords, then press Search—nothing runs until you do.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
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
            aria-label="Manual literature search query"
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
        <label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-600 dark:text-slate-500/90">
          <input
            type="checkbox"
            checked={useNoteContext}
            onChange={(e) => setUseNoteContext(e.target.checked)}
            className="rounded border-slate-300 text-sky-600"
          />
          <span>
            Blend open note into <span className="font-medium">this</span> search
            only (title ≤{NOTE_CONTEXT_TITLE_WORDS} words, body ≤
            {NOTE_CONTEXT_BODY_WORDS}). Does not affect Recommended below.
          </span>
        </label>
        {searchError ? (
          <p className={alertErrorClass} role="alert">
            <span className="font-semibold">Search failed.</span>{' '}
            {searchError}
          </p>
        ) : null}
      </section>

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
            Automatic from this note (debounced). Ignores the search field and the
            blend checkbox above; not the same as Similar papers.
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
            {noteRecommended.map((p, i) => (
              <PaperCard
                key={p.paperId ?? `note-rec-${i}-${p.title ?? ''}`}
                paper={p}
                savedIds={savedIds}
                recommendedTone
                onSave={(r) => addReference(currentNoteId, r)}
                onSimilar={onSimilar}
                busySimilar={busySimilar}
              />
            ))}
          </div>
        )}
      </LiteratureDisclosure>

      {resultsSectionVisible ? (
        <LiteratureDisclosure
          headingId="literature-manual-results-heading"
          title="Manual search results"
          titleClassName={sectionHeadingClass}
          resetKey={literatureDisclosureResetKey}
          defaultOpen={resultsDefaultOpen}
          contentDividerClassName="border-slate-200/55 dark:border-white/[0.06]"
        >
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((p, i) => (
                <PaperCard
                  key={p.paperId ?? `res-${i}-${p.title ?? ''}`}
                  paper={p}
                  savedIds={savedIds}
                  onSave={(r) => addReference(currentNoteId, r)}
                  onSimilar={onSimilar}
                  busySimilar={busySimilar}
                />
              ))}
            </div>
          ) : (
            <p className={mutedLineClass}>
              No matches for your manual query. Try other keywords or turn off
              blending the open note.
            </p>
          )}
        </LiteratureDisclosure>
      ) : null}

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
              Papers like the one you clicked{' '}
              <span className="font-medium">Similar</span>
              {' '}on—not from your note or the search box.
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
              {recs.map((p, i) => (
                <PaperCard
                  key={p.paperId ?? `rec-${i}`}
                  paper={p}
                  savedIds={savedIds}
                  onSave={(r) => addReference(currentNoteId, r)}
                  onSimilar={onSimilar}
                  busySimilar={busySimilar}
                />
              ))}
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
            Save from manual results, recommendations, or Similar.
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

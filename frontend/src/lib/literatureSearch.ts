import type { Note, Reference } from '../types'

/** Max words pulled from the open note title when boosting a search query. */
export const NOTE_CONTEXT_TITLE_WORDS = 12
/** Max words pulled from the open note body when boosting a search query. */
export const NOTE_CONTEXT_BODY_WORDS = 40

export type SemanticScholarAuthor = { name?: string }

export type SemanticScholarPaper = {
  paperId?: string
  title?: string
  authors?: (SemanticScholarAuthor | string)[]
  year?: number
  abstract?: string
  url?: string
  citationCount?: number
  venue?: string
  openAccessPdf?: { url?: string }
  externalIds?: { DOI?: string; ArXiv?: string }
}

export type PaperSearchResponse = {
  total?: number
  offset?: number
  next?: number
  data?: SemanticScholarPaper[]
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function notePlainBody(note: Note): string {
  if (note.editorMode === 'latex') return note.content
  return stripHtml(note.content)
}

/** Lexical tie to user text: at most one extra token. */
const MAX_BOOST_TOKENS_LEXICAL = 1

/**
 * Broad single-word query (e.g. "dopamine"): allow a small domain bridge from the note.
 */
const MAX_BOOST_TOKENS_BROAD_SINGLE = 2

/** Inclusive length bounds for the sole user token to qualify as "broad" one-word. */
const BROAD_SINGLE_QUERY_MIN_LEN = 4
const BROAD_SINGLE_QUERY_MAX_LEN = 10

/** Fallback note tokens for broad queries: longish tokens likely to be technical terms. */
const DOMAIN_BRIDGE_FALLBACK_MIN_LEN = 8

/** Note-only search: need this many domain-like tokens after all filters. */
const NOTE_ONLY_MIN_TOKEN_COUNT = 3

/** Note-only: each token must be at least this long (blocks class, exam, …). */
const NOTE_ONLY_MIN_TOKEN_LENGTH = 6

/** Cap note-only query length (tokens). */
const NOTE_ONLY_MAX_TOKENS = 4

const NOTE_BOOST_STOPWORDS = new Set(
  `
  a an and are as at be been being but by can could did do does doing done down during each few
  for from further had has have having he her here hers herself him himself his how i if in into
  is it its itself just me might more most much my myself no nor not now of off on once only or
  other our ours ourselves out over own same she should so some such than that the their them
  themselves then there these they this those through to too under until up very was we were what
  when where which while who whom why will with would you your yours yourself
  `.split(/\s+/)
)

const NOTE_BOOST_BOILERPLATE = new Set([
  'abstract',
  'above',
  'also',
  'appendix',
  'approach',
  'article',
  'articles',
  'background',
  'based',
  'below',
  'between',
  'both',
  'chapter',
  'click',
  'conclusion',
  'data',
  'discussion',
  'draft',
  'each',
  'every',
  'everything',
  'fig',
  'figure',
  'figures',
  'following',
  'however',
  'introduction',
  'lecture',
  'methodology',
  'methods',
  'model',
  'models',
  'nobody',
  'none',
  'nothing',
  'note',
  'notes',
  'page',
  'paper',
  'papers',
  'paragraph',
  'references',
  'related',
  'research',
  'results',
  'section',
  'see',
  'shown',
  'shows',
  'somebody',
  'someone',
  'something',
  'study',
  'studies',
  'such',
  'table',
  'tables',
  'therefore',
  'thus',
  'todo',
  'untitled',
  'using',
  'via',
  'within',
])

/**
 * Broad academic / edu vocabulary — dropped from boost candidates so domain terms
 * (e.g. drug names, rare conditions) can surface; err on skipping boost when only
 * these remain.
 */
const NOTE_BOOST_GENERIC_ACADEMIC = new Set(
  `
  ability academic academics across affect affects analysis analyses argue argued argues
  argument arguments article aspects assessment assessments assumptions based basic basis
  benefit benefits better between brain broad broader broadly campus challenges chapter
  classroom classrooms cognitive cognition college colleges common commonly community
  comprehensive concept concepts conceptual conclude concluded conclusion conclusions
  consider considerable considered considering context contexts contribute contributed
  contributes contributing contribution contributions course courses critical culturally
  curriculum curricula debate debates demonstrate demonstrated demonstrates demonstrating
  depth describe described describes describing detail detailed details develop developed
  developing development developments discuss discussed discusses discussing discussion
  diverse diversity domain domains dynamic dynamics economic educational effectively
  effects effect efficacy emphasize emphasized emphasizes empirical employ employed
  employment enable enables enabling engage engaged engages engaging enhancement
  especially essay essential essentially establish established establishes ethical
  evaluate evaluated evaluates evaluating evaluation evidence examine examined examines
  examining example examples exclude excluded excludes existing explores exploring explore
  exposed exposure factor factors faculty field fields findings finding focus focused
  focuses framing framework frameworks further furthermore future gap gaps gender
  general generally generate generated generation global goal goals grade grades graduate
  graduates greatly group groups growth guide guided guidelines highlight highlighted
  highlights highly historical human humans hypothesis hypotheses idea ideas identify
  identified identifies identifying illustrate illustrated illustrates illustrating impact
  impacts implications implication important importance improve improved improvement
  improvements improves increasing increasingly indicate indicated indicates indicating
  individuals influence influences influential information initiative initiatives insights
  insight integrate integrated integrates integrating integration interactions interactive
  interest interests interpret interpretation interpretations investigated investigating
  investigation investigations issue issues journal journals key knowledge largely
  learning learned learners learner lecture lectures level levels literature limit limited
  limitations limitation linear link linked links major majority manage management manner
  material materials may measure measured measures measuring mechanism mechanisms mental
  method methods metric metrics modality modalities modelled modelling modern moreover
  multiple numerous observed observations observe observes obtaining occurs offer offered
  offering offers often overall overview particularly participants participation patient
  patients patterns pattern pedagogy peer peers people perception perceptions performance
  performances period perspective perspectives phenomena phenomenon policy policies
  population populations positive positively potential potentially practice practices
  practitioner practitioners predict predicted predicting prediction predictions present
  presented presenting presents previous primarily primary principle principles problem
  problems procedure procedures process processes produce produced produces producing
  program programmes programs project projects promote promoted promotes promoting
  proposal proposals proposed psychology public publication publications purpose purposes
  question questions range ranges rate rates rather rationale recommend recommended
  recommends regarding related relationship relationships relative relatively relevance
  relevant replicate replicated report reported reports research researcher researchers
  respect respectively response responses review reviewed reviews role roles sample
  sampled samples sampling scale scales scholar scholars scholarship school schools science
  sciences scientific scope section seek seeking seeks seem seemed seemingly seems
  selected selection significant significantly significance similar similarities similarity
  simply situation situations skills social societies society solution solutions solve
  solved sources source space spaces specific specifically spectrum stakeholders standard
  standards strategies strategy strong stronger strongly structural structure structures
  student students studies study studying subject subjects substantial substantially
  suggest suggested suggesting suggests summary summaries support supported supporting
  supports survey surveys systematic systems system teachers teaching team teams
  technical techniques technology tend tended tendency tends term terms theme themes
  theoretical theories theory therefore thesis thought thoughts throughout thus topic
  topics tradition traditional training transform transformation transformations trend
  trends typically understanding understandings understood undertake undertaken
  underlying understand understanding undertake university universities various vary
  varying vast versus via view views viewpoint widely widespread within women workplace
  writing written young youth
  `
    .split(/\s+/)
    .filter(Boolean)
)

/**
 * Extra edu / syllabus / econ junk — always blocked for boost and note-only search
 * (overlaps generic set for clarity and to catch short words not in the big list).
 */
const NOTE_BOOST_EXPLICIT_JUNK = new Set(
  `
  assignment assignments brain campus class classes cognitive college colleges course courses
  discussion discussions econ economic economics economy effect effects exam exams grade grades
  homework impact introduction introductions learning lecture lectures lesson lessons method methods
  module modules paper papers professor professors research school schools semester student students
  study studies syllabus teacher teachers topic topics unit units university universities week weeks
  `
    .split(/\s+/)
    .filter(Boolean)
)

function isBlockedForBoostContext(t: string): boolean {
  return (
    NOTE_BOOST_GENERIC_ACADEMIC.has(t) || NOTE_BOOST_EXPLICIT_JUNK.has(t)
  )
}

/**
 * Clinical / neuro / pharma terms we prefer when widening a broad one-word query.
 * (Still must pass cleaned + not duplicate the user's word.)
 */
const NOTE_BOOST_DOMAIN_BRIDGE_PREFERRED = new Set(
  `
  adhd adderall amphetamine amphetamines antipsychotic antipsychotics anxiolytic atomoxetine
  baroreceptor benzodiazepine benzodiazepines bupropion cardiomyopathy cathinone comorbid
  comorbidity contraindication contraindications depolarization desipramine detoxification
  dexamfetamine dexmethylphenidate dopaminergic dyskinesia dysregulation executive extrapyramidal
  guanfacine hyperactivity hypertension hypotension imipramine inattention intoxication
  lisdexamfetamine medication medications methamphetamine methylphenidate misuse monoamine
  myocardial myocarditis naltrexone neuroleptic neurotransmitter norepinephrine noradrenaline
  overdose pathway pathways pharmacodynamics pharmacokinetics pharmacotherapy prescription
  psychostimulant psychosis psychotic qt-interval receptor receptors reuptake reward
  schizophrenia seizure seizures serotonin stimulant stimulants substance-use tachycardia
  tachycardias titration tolerance toxicity tricyclic varenicline ventricular withdrawal
  `
    .split(/\s+/)
    .filter(Boolean)
)

function isBroadSingleWordUserQuery(userTokens: string[]): boolean {
  if (userTokens.length !== 1) return false
  const t = userTokens[0]!
  if (
    t.length < BROAD_SINGLE_QUERY_MIN_LEN ||
    t.length > BROAD_SINGLE_QUERY_MAX_LEN
  ) {
    return false
  }
  if (isBlockedForBoostContext(t)) return false
  return true
}

/**
 * When the user typed one broad term, add 1–2 note tokens from a preferred clinical list
 * first, then long technical-looking tokens — still never generic/junk (cleaned pre-filtered).
 */
function domainBridgeBoostForBroadQuery(
  cleaned: string[],
  soleUserToken: string
): string[] {
  const u = soleUserToken.toLowerCase()
  const out: string[] = []
  const picked = new Set<string>()

  const take = (t: string) => {
    if (t === u || picked.has(t)) return
    if (t.length < 4) return
    picked.add(t)
    out.push(t)
  }

  for (const t of cleaned) {
    if (NOTE_BOOST_DOMAIN_BRIDGE_PREFERRED.has(t)) take(t)
    if (out.length >= MAX_BOOST_TOKENS_BROAD_SINGLE) return out
  }

  for (const t of cleaned) {
    if (NOTE_BOOST_DOMAIN_BRIDGE_PREFERRED.has(t)) continue
    if (t.length < DOMAIN_BRIDGE_FALLBACK_MIN_LEN) continue
    take(t)
    if (out.length >= MAX_BOOST_TOKENS_BROAD_SINGLE) return out
  }

  return out
}

/** Meaningful query tokens (stopwords stripped) for lexical alignment. */
function getUserContentTokens(base: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of base.split(/[^\p{L}\p{N}+.-]+/u)) {
    const t = normalizeBoostToken(part)
    if (!t || NOTE_BOOST_STOPWORDS.has(t)) continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

/**
 * Note token must share a real tie to something the user typed (prefix overlap,
 * or substantive substring), or boost is skipped.
 */
function isLexicallyRelatedNoteToken(t: string, userTokens: string[]): boolean {
  if (t.length < 5) return false
  if (userTokens.length === 0) return false

  for (const u of userTokens) {
    if (u.length < 3) continue
    if (t === u) return false

    const maxPrefix = Math.min(t.length, u.length)
    const prefixLen = u.length >= 4 ? Math.min(4, maxPrefix) : Math.min(3, maxPrefix)
    if (prefixLen >= 3 && t.slice(0, prefixLen) === u.slice(0, prefixLen)) {
      return true
    }

    if (t.length >= 5 && u.length >= 5) {
      if (t.includes(u) || u.includes(t)) return true
    }
  }
  return false
}

function hasVowelCluster(t: string): boolean {
  return /[aeiouy]/i.test(t)
}

/**
 * Conservative domain-ish check for note-only search (no user query to anchor).
 */
function passesNoteOnlyDomainHeuristic(t: string): boolean {
  if (t.length < NOTE_ONLY_MIN_TOKEN_LENGTH) return false
  if (!hasVowelCluster(t)) return false
  if (isBlockedForBoostContext(t)) return false
  return true
}

/**
 * Strip LaTeX so commands/macros do not pollute search tokens. Best-effort; keeps plain text.
 */
function stripLatexNoise(source: string): string {
  let s = source
  s = s.replace(/%[^\n\r]*/g, ' ')
  s = s.replace(/\\begin\{[^}]*\}[\s\S]*?\\end\{[^}]*\}/g, ' ')
  s = s.replace(
    /\\[a-zA-Z@]+(?:\[[^\]]*\])?(?:\{[^{}]*\})?/g,
    ' '
  )
  s = s.replace(/\\[a-zA-Z@]+/g, ' ')
  s = s.replace(/\$\$[\s\S]*?\$\$/g, ' ')
  s = s.replace(/\$[^$\n\r]*\$/g, ' ')
  s = s.replace(/[{}[\]_^~#&]/g, ' ')
  return s.replace(/\s+/g, ' ').trim()
}

function rawWordsFromText(text: string, maxWords: number): string[] {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, maxWords)
}

/** Lowercase token suitable for boost, or null if punctuation/noise only. */
function normalizeBoostToken(raw: string): string | null {
  const w = raw.replace(/^[^\p{L}\p{N}+.-]+|[^\p{L}\p{N}+.-]+$/gu, '')
  if (w.length < 2) return null
  const lower = w.toLowerCase()
  if (!/^[\p{L}\p{N}][\p{L}\p{N}+.-]*$/u.test(lower)) return null
  return lower
}

function isMeaningfulBoostToken(t: string): boolean {
  if (t.length < 2) return false
  if (/^\d+$/.test(t)) return false
  if (NOTE_BOOST_STOPWORDS.has(t)) return false
  if (NOTE_BOOST_BOILERPLATE.has(t)) return false
  return true
}

function collectFilteredNoteTokens(note: Note): string[] {
  const titleWords = rawWordsFromText(note.title, NOTE_CONTEXT_TITLE_WORDS)
  let bodyText = notePlainBody(note)
  if (note.editorMode === 'latex') {
    bodyText = stripLatexNoise(bodyText)
  }
  const bodyWords = rawWordsFromText(bodyText, NOTE_CONTEXT_BODY_WORDS)

  const ordered: string[] = []
  const seen = new Set<string>()

  const pushWord = (w: string) => {
    const t = normalizeBoostToken(w)
    if (!t || !isMeaningfulBoostToken(t) || seen.has(t)) return
    seen.add(t)
    ordered.push(t)
  }

  for (const w of titleWords) pushWord(w)
  for (const w of bodyWords) pushWord(w)

  return ordered
}

/**
 * Conservative Semantic Scholar query from the open note’s title + body only.
 * Same bar as note-only search in {@link buildAugmentedSearchQuery}: generic/junk
 * tokens removed; requires several domain-like tokens. Returns null when unsafe or too weak.
 */
export function buildNoteRecommendationSearchQuery(
  note: Note | undefined
): string | null {
  if (!note) return null
  const noteTokens = collectFilteredNoteTokens(note)
  const cleaned = noteTokens.filter((t) => !isBlockedForBoostContext(t))
  const domainTokens = cleaned.filter((t) => passesNoteOnlyDomainHeuristic(t))
  if (domainTokens.length < NOTE_ONLY_MIN_TOKEN_COUNT) return null
  return domainTokens.slice(0, NOTE_ONLY_MAX_TOKENS).join(' ')
}

/**
 * Note-context boost: multi-word / specific queries only get lexically tied tokens (max 1).
 * Broad one-word queries may get a small domain bridge (max 2) when lexical tie finds nothing.
 * Note-only search uses a high bar and often returns ''.
 */
export function buildAugmentedSearchQuery(
  userQuery: string,
  note: Note | undefined
): string {
  const base = userQuery.trim()
  if (!note) return base

  const noteTokens = collectFilteredNoteTokens(note)
  const cleaned = noteTokens.filter((t) => !isBlockedForBoostContext(t))

  if (base.length > 0) {
    const userTokens = getUserContentTokens(base)
    const userTokenSet = new Set(userTokens)

    const related = cleaned.filter(
      (t) =>
        t.length >= 5 &&
        !userTokenSet.has(t) &&
        isLexicallyRelatedNoteToken(t, userTokens)
    )

    let boost: string[] = []
    if (related.length > 0) {
      boost = related.slice(0, MAX_BOOST_TOKENS_LEXICAL)
    } else if (isBroadSingleWordUserQuery(userTokens)) {
      boost = domainBridgeBoostForBroadQuery(cleaned, userTokens[0]!)
    }

    if (boost.length === 0) {
      return base
    }

    return `${base} ${boost.join(' ')}`.slice(0, 480)
  }

  const domainTokens = cleaned.filter((t) => passesNoteOnlyDomainHeuristic(t))
  if (domainTokens.length < NOTE_ONLY_MIN_TOKEN_COUNT) {
    return ''
  }

  return domainTokens.slice(0, NOTE_ONLY_MAX_TOKENS).join(' ').slice(0, 480)
}

function authorName(a: SemanticScholarAuthor | string | undefined): string {
  if (!a) return ''
  if (typeof a === 'string') return a
  return typeof a.name === 'string' ? a.name : ''
}

/**
 * Tooltip copy for the literature sidebar score badge. Plain-English summary of
 * {@link estimateCredibility} (not a formal quality measure).
 */
export const CREDIBILITY_HEURISTIC_TOOLTIP =
  'In-app heuristic from 0–100 (not journal rank or peer review). It adds points for how complete the record is (abstract, authors, year, stable IDs or links), uses a capped log of citation count so citations alone cannot max the score, applies a simple venue tier (including a short list of familiar publishers and conferences), and makes a small adjustment for publication age. Use only as a quick orientation signal.'

/** Upper bounds per block (documentation; combined raw sum is clamped to 0–100). */
const _CRED_SCORE_CAPS = {
  metadata: 36,
  citations: 30,
  venue: 22,
} as const

function countPaperAuthors(p: SemanticScholarPaper): number {
  return (p.authors ?? []).map((a) => authorName(a).trim()).filter(Boolean)
    .length
}

function metadataCompletenessPoints(p: SemanticScholarPaper): number {
  let pts = 0
  const title =
    typeof p.title === 'string' ? p.title.trim() : ''
  if (title.length >= 8) pts += 4

  const abs = typeof p.abstract === 'string' ? p.abstract.trim() : ''
  if (abs.length >= 80) pts += 8
  else if (abs.length >= 28) pts += 4
  else if (abs.length >= 10) pts += 2

  const n = countPaperAuthors(p)
  if (n >= 5) pts += 10
  else if (n >= 2) pts += 8
  else if (n === 1) pts += 4

  const y = p.year
  const cy = new Date().getFullYear()
  if (
    typeof y === 'number' &&
    Number.isFinite(y) &&
    y >= 1850 &&
    y <= cy + 2
  ) {
    pts += 6
  }

  let idPts = 0
  const pid = p.paperId
  if (typeof pid === 'string' && pid.trim().length > 0) idPts = 8
  const ext = p.externalIds
  if (idPts < 6 && ext && typeof ext === 'object') {
    const doi = typeof ext.DOI === 'string' && ext.DOI.trim().length > 4
    const ax = typeof ext.ArXiv === 'string' && ext.ArXiv.trim().length > 2
    if (doi || ax) idPts = Math.max(idPts, 6)
  }
  if (idPts < 4) {
    const u = typeof p.url === 'string' && p.url.trim().length > 8
    const pdf =
      typeof p.openAccessPdf?.url === 'string' &&
      p.openAccessPdf.url.trim().length > 8
    if (u || pdf) idPts = Math.max(idPts, 4)
  }
  pts += idPts

  return Math.min(_CRED_SCORE_CAPS.metadata, pts)
}

function citationHeuristicPoints(p: SemanticScholarPaper): number {
  const c =
    typeof p.citationCount === 'number' && Number.isFinite(p.citationCount)
      ? Math.max(0, p.citationCount)
      : 0
  const curve = Math.round(Math.log10(c + 1) * 6.5)
  const withFloor = 4 + curve
  return Math.min(_CRED_SCORE_CAPS.citations, withFloor)
}

/**
 * Familiar publishers / proceedings (substring match on lowercased venue).
 * Kept short on purpose; extend intentionally when needed. Avoids bare "science"
 * to reduce false positives (e.g. "data science").
 */
const STRONG_VENUE_FRAGMENTS = [
  'aaai',
  'acl',
  'acm ',
  'acm)',
  'bmj',
  'cell',
  'chi ',
  'cvpr',
  'eccv',
  'elsevier',
  'emnlp',
  'iccv',
  'iclr',
  'icml',
  'icra',
  'icse',
  'ieee',
  'ijcai',
  'iros',
  'jama',
  'lancet',
  'nature',
  'neurips',
  'nejm',
  'osdi',
  'physical review',
  'phys rev',
  'pnas',
  'sigcomm',
  'siggraph',
  'sosp',
  'springer',
  'usenix',
  'wiley',
]

const WEAK_VENUE_REGEX =
  /^(unknown|n\/a|na|tbd|withdrawn|retracted|anonymous)/i

const GENERIC_VENUE_REGEX =
  /\b(workshop|symposium|poster|abstract\s*only|preprint|under review|informal|private)\b/i

function venueHeuristicPoints(venue: unknown): number {
  if (typeof venue !== 'string') return 0
  const s = venue.trim()
  if (s.length < 3) return 0
  const lower = s.toLowerCase()
  if (WEAK_VENUE_REGEX.test(lower)) return 2
  if (GENERIC_VENUE_REGEX.test(lower)) return 5
  for (const frag of STRONG_VENUE_FRAGMENTS) {
    if (lower.includes(frag))
      return Math.min(_CRED_SCORE_CAPS.venue, 20)
  }
  if (/\barxiv\b|\bcorr\b/i.test(lower)) return 7
  return Math.min(_CRED_SCORE_CAPS.venue, 12)
}

function recencyAdjustmentPoints(year: number | undefined): number {
  if (typeof year !== 'number' || !Number.isFinite(year)) return 0
  const cy = new Date().getFullYear()
  const age = cy - year
  if (age < -1) return 0
  if (age <= 2) return 5
  if (age <= 7) return 3
  if (age <= 16) return 1
  if (age <= 35) return -1
  return -3
}

/**
 * Lightweight 0–100 orientation score from Semantic Scholar–shaped metadata.
 * Not a formal credibility or journal-quality measure.
 */
export function estimateCredibility(p: SemanticScholarPaper): number {
  const raw =
    metadataCompletenessPoints(p) +
    citationHeuristicPoints(p) +
    venueHeuristicPoints(p.venue) +
    recencyAdjustmentPoints(p.year)
  return Math.max(0, Math.min(100, Math.round(raw)))
}

function paperUrl(p: SemanticScholarPaper): string {
  if (typeof p.openAccessPdf?.url === 'string' && p.openAccessPdf.url)
    return p.openAccessPdf.url
  if (typeof p.url === 'string' && p.url) return p.url
  const id = p.paperId
  if (typeof id === 'string' && id)
    return `https://www.semanticscholar.org/paper/${encodeURIComponent(id)}`
  return ''
}

/** External link for a search/similar card: open-access PDF, API URL, or Semantic Scholar. */
export function semanticScholarPaperOpenUrl(p: SemanticScholarPaper): string {
  return paperUrl(p)
}

export function semanticScholarPaperToReference(p: SemanticScholarPaper): Reference | null {
  const id = p.paperId
  if (typeof id !== 'string' || !id) return null
  const title = typeof p.title === 'string' ? p.title : 'Untitled'
  const authors = (p.authors ?? [])
    .map((a) => authorName(a))
    .filter((n) => n.length > 0)
  const year =
    typeof p.year === 'number' && Number.isFinite(p.year)
      ? p.year
      : new Date().getFullYear()
  const abstract = typeof p.abstract === 'string' ? p.abstract : ''
  return {
    id,
    title,
    authors,
    year,
    abstract,
    url: paperUrl(p),
    credibility: estimateCredibility(p),
    venue: typeof p.venue === 'string' ? p.venue : undefined,
    citationCount:
      typeof p.citationCount === 'number' ? p.citationCount : undefined,
  }
}

/** Stored reference: use saved URL, or Semantic Scholar by paper id. */
export function referenceOpenUrl(r: Reference): string {
  const u = typeof r.url === 'string' ? r.url.trim() : ''
  if (u) return u
  return `https://www.semanticscholar.org/paper/${encodeURIComponent(r.id)}`
}

async function getJson<T>(path: string): Promise<T> {
  const url = new URL(path, window.location.origin)
  const r = await fetch(url.toString())
  const text = await r.text()
  let body: unknown
  try {
    body = JSON.parse(text) as unknown
  } catch {
    throw new Error(text.slice(0, 200) || `HTTP ${r.status}`)
  }
  if (!r.ok) {
    const msg =
      typeof body === 'object' &&
      body !== null &&
      'error' in body &&
      typeof (body as { error: string }).error === 'string'
        ? (body as { error: string }).error
        : `Request failed (${r.status})`
    throw new Error(msg)
  }
  return body as T
}

export async function searchPapers(
  query: string,
  limit = 15
): Promise<PaperSearchResponse> {
  const q = query.trim()
  if (!q) return { data: [] }
  const u = new URL('/api/paper-search', window.location.origin)
  u.searchParams.set('query', q)
  u.searchParams.set('limit', String(limit))
  return getJson<PaperSearchResponse>(u.pathname + u.search)
}

export async function fetchRecommendations(
  paperId: string,
  limit = 10
): Promise<SemanticScholarPaper[]> {
  const u = new URL('/api/paper-recommendations', window.location.origin)
  u.searchParams.set('paperId', paperId)
  u.searchParams.set('limit', String(limit))
  const raw = await getJson<unknown>(u.pathname + u.search)
  if (Array.isArray(raw)) return raw as SemanticScholarPaper[]
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'recommendedPapers' in raw &&
    Array.isArray((raw as { recommendedPapers: unknown }).recommendedPapers)
  ) {
    return (raw as { recommendedPapers: SemanticScholarPaper[] })
      .recommendedPapers
  }
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'data' in raw &&
    Array.isArray((raw as { data: unknown }).data)
  ) {
    return (raw as { data: SemanticScholarPaper[] }).data
  }
  return []
}

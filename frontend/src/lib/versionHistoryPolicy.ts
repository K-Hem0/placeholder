import type { EditorMode } from '../types'

/** Debounce window for writing the in-memory app state to localStorage (not version snapshots). */
export const AUTOSAVE_TO_DISK_MS = 1500

/** After this much idle time since the last edit, a history snapshot may be created. */
export const HISTORY_IDLE_SNAPSHOT_MS = 15_000

/** Minimum interval between automatic “idle” snapshots (prevents bursts after long pauses). */
export const HISTORY_MIN_GAP_IDLE_MS = 12_000

/** Periodic safety snapshot while editing (single fixed value in the 3–5 min range). */
export const HISTORY_PERIODIC_SAFETY_MS = 4 * 60 * 1000

/** Treat as “enough time passed” to allow a weaker change to still become a snapshot. */
export const HISTORY_LONG_GAP_MS = 2 * 60 * 1000

export type HistorySnapshotReason =
  | 'idle'
  | 'note_switch'
  | 'blur'
  | 'before_restore'
  | 'periodic_safety'

export type MeaningfulChangeScore = {
  /** Larger = more different; used for thresholds. */
  score: number
  lengthDelta: number
  lineDelta: number
  blockDelta: number
  headingDelta: number
  structuralChange: boolean
}

const BLOCK_TAG_RE =
  /<\/?(p|h[1-6]|li|blockquote|pre|hr|div|ul|ol)\b/gi
const HEADING_TAG_RE = /<\/?h[1-6]\b/gi

function countMatches(re: RegExp, s: string): number {
  const m = s.match(re)
  return m ? m.length : 0
}

function lineCount(s: string): number {
  if (s.length === 0) return 0
  return s.split(/\r\n|\r|\n/).length
}

/** Collapse whitespace for near-duplicate detection. */
export function normalizeForHistoryDedup(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

export function getMeaningfulChangeScore(
  previous: string,
  next: string,
  mode: EditorMode
): MeaningfulChangeScore {
  if (previous === next) {
    return {
      score: 0,
      lengthDelta: 0,
      lineDelta: 0,
      blockDelta: 0,
      headingDelta: 0,
      structuralChange: false,
    }
  }

  const lengthDelta = Math.abs(next.length - previous.length)

  if (mode === 'latex') {
    const lineDelta = Math.abs(lineCount(next) - lineCount(previous))
    const structuralChange = lineDelta >= 2 || lengthDelta >= 40
    const score = lengthDelta + 6 * lineDelta
    return {
      score,
      lengthDelta,
      lineDelta,
      blockDelta: lineDelta,
      headingDelta: 0,
      structuralChange,
    }
  }

  const blockPrev = countMatches(BLOCK_TAG_RE, previous)
  const blockNext = countMatches(BLOCK_TAG_RE, next)
  const blockDelta = Math.abs(blockNext - blockPrev)

  const headPrev = countMatches(HEADING_TAG_RE, previous)
  const headNext = countMatches(HEADING_TAG_RE, next)
  const headingDelta = Math.abs(headNext - headPrev)

  const plainPrev = previous.replace(/<[^>]+>/g, ' ')
  const plainNext = next.replace(/<[^>]+>/g, ' ')
  const lineDelta = Math.abs(lineCount(plainNext) - lineCount(plainPrev))

  const structuralChange =
    blockDelta > 0 ||
    headingDelta > 0 ||
    /\b(pre|blockquote)\b/i.test(next) !==
      /\b(pre|blockquote)\b/i.test(previous)

  const score =
    lengthDelta +
    8 * lineDelta +
    35 * blockDelta +
    45 * headingDelta

  return {
    score,
    lengthDelta,
    lineDelta,
    blockDelta,
    headingDelta,
    structuralChange,
  }
}

export type ShouldCreateHistorySnapshotInput = {
  /** Content at the last checkpoint (`lastSnapRef`); becomes the stored snapshot body. */
  previous: string
  /** Current document body. */
  next: string
  lastSnapshotAt: number
  now: number
  mode: EditorMode
  reason: HistorySnapshotReason
}

/**
 * Whether we should append a history snapshot for this transition.
 * `previous` is the last checkpointed body; `next` is the current body.
 */
export function shouldCreateHistorySnapshot(
  input: ShouldCreateHistorySnapshotInput
): boolean {
  const { previous, next, lastSnapshotAt, now, mode, reason } = input

  if (previous === next) return false

  if (normalizeForHistoryDedup(previous) === normalizeForHistoryDedup(next)) {
    return false
  }

  const sinceLastSnapshot = now - lastSnapshotAt
  const scoreResult = getMeaningfulChangeScore(previous, next, mode)
  const { score, lengthDelta, structuralChange } = scoreResult

  const meaningful =
    structuralChange ||
    score >= 42 ||
    lengthDelta >= 72 ||
    (lengthDelta >= 18 && score >= 22)

  const longGap = sinceLastSnapshot >= HISTORY_LONG_GAP_MS
  const weakButTimed =
    longGap && lengthDelta >= 10 && score >= 14

  switch (reason) {
    case 'before_restore':
      return true

    case 'note_switch':
      return (
        meaningful ||
        lengthDelta >= 6 ||
        score >= 12 ||
        structuralChange
      )

    case 'blur':
      return meaningful || weakButTimed

    case 'periodic_safety':
      if (sinceLastSnapshot < HISTORY_PERIODIC_SAFETY_MS) return false
      return meaningful || weakButTimed || lengthDelta >= 24

    case 'idle': {
      if (sinceLastSnapshot < HISTORY_MIN_GAP_IDLE_MS && !meaningful) {
        return false
      }
      return meaningful || weakButTimed
    }

    default:
      return false
  }
}

/** Skip if the new snapshot would duplicate the latest history entry’s body. */
export function isNearDuplicateOfLatest(
  latestVersionContent: string | undefined,
  snapshotPreviousContent: string
): boolean {
  if (latestVersionContent === undefined) return false
  if (latestVersionContent === snapshotPreviousContent) return true
  const a = normalizeForHistoryDedup(latestVersionContent)
  const b = normalizeForHistoryDedup(snapshotPreviousContent)
  if (a.length < 12 || b.length < 12) return a === b
  if (a === b) return true
  return false
}

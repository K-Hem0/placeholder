import type { NoteTemplateId } from '../types'
import { isNoteTemplateId } from './templateRegistry'

const STORAGE_KEY = 'scholarly-notes-template-usage-v1'
const MAX_RECENT = 5

export type TemplateUsageState = {
  recent: NoteTemplateId[]
  favorites: NoteTemplateId[]
}

const empty: TemplateUsageState = { recent: [], favorites: [] }

function sanitizeIds(raw: unknown): NoteTemplateId[] {
  if (!Array.isArray(raw)) return []
  const out: NoteTemplateId[] = []
  for (const x of raw) {
    if (typeof x === 'string' && isNoteTemplateId(x) && !out.includes(x))
      out.push(x)
  }
  return out
}

export function loadTemplateUsage(): TemplateUsageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...empty }
    const p = JSON.parse(raw) as Record<string, unknown>
    return {
      recent: sanitizeIds(p.recent).slice(0, MAX_RECENT),
      favorites: sanitizeIds(p.favorites),
    }
  } catch {
    return { ...empty }
  }
}

function persist(next: TemplateUsageState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
}

export function recordTemplateUse(id: NoteTemplateId): void {
  const cur = loadTemplateUsage()
  const recent = [id, ...cur.recent.filter((x) => x !== id)].slice(
    0,
    MAX_RECENT
  )
  persist({ ...cur, recent })
}

export function toggleFavoriteTemplate(id: NoteTemplateId): TemplateUsageState {
  const cur = loadTemplateUsage()
  const set = new Set(cur.favorites)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  const next = { ...cur, favorites: [...set] }
  persist(next)
  return next
}

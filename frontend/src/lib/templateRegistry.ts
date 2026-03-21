import type { NoteTemplateId } from '../types'
import {
  getNoteTemplatePayload,
  NOTE_TEMPLATE_DEFINITIONS,
  type NoteTemplateOptions,
  type NoteTemplatePayload,
  type TemplateCategoryId,
} from './noteTemplateConfig'

export { getNoteTemplatePayload }
export type { NoteTemplateOptions, NoteTemplatePayload, ResearchPaperVariant } from './noteTemplateConfig'

export type { TemplateCategoryId } from './noteTemplateConfig'

export type TemplateMeta = {
  id: NoteTemplateId
  label: string
  shortLabel: string
  category: TemplateCategoryId
  hint?: string
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategoryId, string> = {
  core: 'Core',
  research: 'Research',
  writing: 'Writing',
}

export const TEMPLATE_REGISTRY: TemplateMeta[] =
  NOTE_TEMPLATE_DEFINITIONS.map((d) => ({
    id: d.id,
    label: d.label,
    shortLabel: d.shortLabel,
    category: d.category,
    hint: d.hint,
  }))

const byId = new Map(TEMPLATE_REGISTRY.map((m) => [m.id, m] as const))

export function getTemplateMeta(id: NoteTemplateId): TemplateMeta {
  return byId.get(id) ?? TEMPLATE_REGISTRY[0]!
}

export const ALL_TEMPLATE_IDS: NoteTemplateId[] = TEMPLATE_REGISTRY.map(
  (m) => m.id
)

/** Same ids/order as `TEMPLATE_REGISTRY` — Suggested, search, and categories stay aligned. */
export const SUGGESTED_TEMPLATE_IDS: NoteTemplateId[] = [...ALL_TEMPLATE_IDS]

const VALID_IDS = new Set<string>(ALL_TEMPLATE_IDS)

export function isNoteTemplateId(v: string): v is NoteTemplateId {
  return VALID_IDS.has(v)
}

/** Maps removed template ids so persisted settings stay valid. */
const LEGACY_TEMPLATE_ID: Record<string, NoteTemplateId> = {
  'daily-note': 'daily-lecture',
  'lecture-notes': 'daily-lecture',
  'meeting-notes': 'daily-lecture',
  'latex-homework': 'daily-lecture',
  'literature': 'research-paper',
  'research-log': 'research-paper',
  'annotated-bibliography': 'research-paper',
  'essay-outline': 'research-paper',
  'math-proof': 'research-paper',
  'latex-article': 'research-paper',
  'latex-proof': 'research-paper',
  'reflection': 'blog-post',
  'coding-notes': 'blank',
  'bug-log': 'blank',
}

export function migrateLegacyNoteTemplateId(
  raw: string
): NoteTemplateId | null {
  if (isNoteTemplateId(raw)) return raw
  return LEGACY_TEMPLATE_ID[raw] ?? null
}

export const TEMPLATE_LABELS: Record<NoteTemplateId, string> =
  Object.fromEntries(
    TEMPLATE_REGISTRY.map((m) => [m.id, m.label])
  ) as Record<NoteTemplateId, string>

export function getTemplatesByCategory(
  cat: TemplateCategoryId
): TemplateMeta[] {
  return TEMPLATE_REGISTRY.filter((m) => m.category === cat)
}

const CATEGORY_ORDER: TemplateCategoryId[] = ['core', 'research', 'writing']

export function listCategoryOrder(): TemplateCategoryId[] {
  return [...CATEGORY_ORDER]
}

/**
 * Full note defaults for a template: title, HTML body, folder, and tags.
 */
export function getTemplateHtml(
  id: NoteTemplateId,
  options?: NoteTemplateOptions
): NoteTemplatePayload {
  return getNoteTemplatePayload(id, options)
}

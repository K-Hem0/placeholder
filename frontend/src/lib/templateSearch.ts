import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_REGISTRY,
  type TemplateMeta,
} from './templateRegistry'

export function filterTemplatesByQuery(query: string): TemplateMeta[] {
  const t = query.trim().toLowerCase()
  if (!t) return [...TEMPLATE_REGISTRY]
  return TEMPLATE_REGISTRY.filter((m) => {
    if (m.label.toLowerCase().includes(t)) return true
    if (m.shortLabel.toLowerCase().includes(t)) return true
    if (m.hint?.toLowerCase().includes(t)) return true
    if (TEMPLATE_CATEGORY_LABELS[m.category].toLowerCase().includes(t))
      return true
    return false
  })
}

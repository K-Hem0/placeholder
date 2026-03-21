/** Barrel — template metadata and HTML live in `noteTemplateConfig` / `templateRegistry`. */
export {
  ALL_TEMPLATE_IDS,
  getNoteTemplatePayload,
  getTemplateHtml,
  getTemplateMeta,
  getTemplatesByCategory,
  isNoteTemplateId,
  listCategoryOrder,
  migrateLegacyNoteTemplateId,
  SUGGESTED_TEMPLATE_IDS,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_LABELS,
  TEMPLATE_REGISTRY,
  type NoteTemplateOptions,
  type NoteTemplatePayload,
  type ResearchPaperVariant,
  type TemplateCategoryId,
  type TemplateMeta,
} from './templateRegistry'

export { filterTemplatesByQuery } from './templateSearch'

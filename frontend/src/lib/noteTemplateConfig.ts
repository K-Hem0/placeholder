import type { EditorMode, NoteTemplateId } from '../types'
import { LATEX_RESEARCH_PAPER_SKELETON } from './latexPaperTemplates'

export type TemplateCategoryId = 'core' | 'research' | 'writing'

/** Subtypes for the single `research-paper` template id (more LaTeX kinds can extend this pattern). */
export type ResearchPaperVariant = 'standard' | 'latex'

export type NoteTemplateOptions = {
  researchPaperVariant?: ResearchPaperVariant
}

export type NoteTemplatePayload = {
  title: string
  /** Rich-text HTML or raw `.tex` source, per `editorMode`. */
  body: string
  editorMode: EditorMode
  /** Empty string = inbox / uncategorized */
  folder: string
  tags: string[]
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatLongDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(d)
}

/** Shared HTML fragments — TipTap rich-text (StarterKit headings, lists, hr, blockquote). */
function richDailyLectureBody(dateLine: string): string {
  return (
    '<h2>Session details</h2>' +
    `<p><strong>Date</strong> — ${escapeHtml(dateLine)}</p>` +
    '<p><strong>Course</strong> — </p>' +
    '<p><strong>Topic</strong> — </p>' +
    '<hr />' +
    '<h2>Key Ideas</h2>' +
    '<ul><li></li></ul>' +
    '<h2>Examples</h2>' +
    '<p></p>' +
    '<h2>Questions</h2>' +
    '<ul><li></li></ul>' +
    '<h2>Summary</h2>' +
    '<p></p>'
  )
}

function richResearchPaperBody(): string {
  return (
    '<h1>Provisional title</h1>' +
    '<p><em>One-sentence summary of the paper’s central claim.</em></p>' +
    '<h2>Topic</h2><p></p>' +
    '<h2>Research Question</h2><p></p>' +
    '<h2>Thesis</h2><p></p>' +
    '<h2>Introduction</h2><p></p>' +
    '<h2>Main Argument</h2><p></p>' +
    '<h2>Evidence</h2><p></p>' +
    '<h2>Counterargument</h2><p></p>' +
    '<h2>Conclusion</h2><p></p>' +
    '<h2>Sources</h2><ul><li></li></ul>'
  )
}

function richBlogPostBody(dateLine: string): string {
  return (
    '<blockquote><p><em>Add a compelling subtitle for readers…</em></p></blockquote>' +
    '<p><strong>Author</strong> — </p>' +
    `<p><strong>Date</strong> — ${escapeHtml(dateLine)}</p>` +
    '<p><strong>Tags</strong> — </p>' +
    '<hr />' +
    '<h2>Hook</h2><p></p>' +
    '<h2>Main Point</h2><p></p>' +
    '<h2>Supporting Sections</h2>' +
    '<h3>First angle</h3><p></p>' +
    '<h3>Second angle</h3><p></p>' +
    '<h3>Third angle</h3><p></p>' +
    '<h2>Closing</h2><p></p>'
  )
}

export function buildResearchPaperPayload(
  variant: ResearchPaperVariant
): NoteTemplatePayload {
  if (variant === 'standard') {
    return {
      title: 'Research Paper Draft',
      editorMode: 'rich',
      body: richResearchPaperBody(),
      folder: 'Research',
      tags: ['research', 'paper'],
    }
  }
  return {
    title: 'Research paper (LaTeX)',
    editorMode: 'latex',
    body: LATEX_RESEARCH_PAPER_SKELETON,
    folder: 'Research',
    tags: ['latex', 'paper'],
  }
}

export type NoteTemplateDefinition = {
  id: NoteTemplateId
  label: string
  shortLabel: string
  category: TemplateCategoryId
  hint?: string
  folder: string
  tags: string[]
  build: () => Pick<NoteTemplatePayload, 'title' | 'body' | 'editorMode'>
}

export const NOTE_TEMPLATE_DEFINITIONS: NoteTemplateDefinition[] = [
  {
    id: 'blank',
    label: 'Blank note',
    shortLabel: 'Blank',
    category: 'core',
    hint: 'Empty body — fastest start',
    folder: '',
    tags: [],
    build: () => ({
      title: 'Untitled',
      editorMode: 'rich',
      body: '<p></p>',
    }),
  },
  {
    id: 'daily-lecture',
    label: 'Daily / Lecture note',
    shortLabel: 'Daily',
    category: 'core',
    hint: 'Dated class outline: session meta, then ideas → summary',
    folder: 'Lecture',
    tags: ['lecture', 'class'],
    build: () => {
      const today = formatLongDate(new Date())
      return {
        title: `Lecture Note — ${today}`,
        editorMode: 'rich',
        body: richDailyLectureBody(today),
      }
    },
  },
  {
    id: 'research-paper',
    label: 'Research paper',
    shortLabel: 'Research',
    category: 'research',
    hint: 'Formal outline (H1 + sections) or LaTeX skeleton',
    folder: 'Research',
    tags: ['research', 'paper'],
    build: () => {
      const p = buildResearchPaperPayload('standard')
      return { title: p.title, body: p.body, editorMode: p.editorMode }
    },
  },
  {
    id: 'blog-post',
    label: 'Blog post',
    shortLabel: 'Blog',
    category: 'writing',
    hint: 'Article draft: subtitle block, meta, hook → closing',
    folder: 'Writing',
    tags: ['blog'],
    build: () => {
      const today = formatLongDate(new Date())
      return {
        title: 'New Blog Post',
        editorMode: 'rich',
        body: richBlogPostBody(today),
      }
    },
  },
]

const defById = new Map(
  NOTE_TEMPLATE_DEFINITIONS.map((d) => [d.id, d] as const)
)

export function getNoteTemplatePayload(
  id: NoteTemplateId,
  options?: NoteTemplateOptions
): NoteTemplatePayload {
  if (id === 'research-paper') {
    const variant = options?.researchPaperVariant ?? 'standard'
    return buildResearchPaperPayload(variant)
  }
  const def = defById.get(id) ?? defById.get('blank')!
  const { title, body, editorMode } = def.build()
  return {
    title,
    body,
    editorMode,
    folder: def.folder,
    tags: [...def.tags],
  }
}

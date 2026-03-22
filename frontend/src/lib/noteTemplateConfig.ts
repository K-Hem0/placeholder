import type { EditorMode, NoteTemplateId } from '../types'

export type TemplateCategoryId = 'core' | 'research' | 'writing'

export type NoteTemplateOptions = Record<string, never>

export type NoteTemplatePayload = {
  title: string
  /** Rich-text HTML or raw `.tex` source, per `editorMode`. */
  body: string
  editorMode: EditorMode
  /** Empty string = inbox / uncategorized */
  folder: string
  tags: string[]
}

function formatLongDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(d)
}

/** Markdown template for research paper (latex mode: source + preview). */
function mdResearchPaperBody(): string {
  return (
    `# Provisional title\n\n*One-sentence summary of the paper's central claim.*\n\n` +
    `## Topic\n\n\n\n## Research Question\n\n\n\n## Thesis\n\n\n\n## Introduction\n\n\n\n` +
    `## Main Argument\n\n\n\n## Evidence\n\n\n\n## Counterargument\n\n\n\n## Conclusion\n\n\n\n## Sources\n\n- `
  )
}

/** Rich HTML for daily/lecture notes (natural-language WYSIWYG). */
function htmlDailyLectureBody(dateLine: string): string {
  return (
    `<p><span class="heading heading-1" data-inline-heading="1">Session details</span></p>
<p><strong>Date</strong> — ${dateLine}</p>
<p><strong>Course</strong> — </p>
<p><strong>Topic</strong> — </p>
<hr>
<p><span class="heading heading-2" data-inline-heading="2">Key Ideas</span></p>
<ul>
<li><p> </p></li>
</ul>
<p><span class="heading heading-3" data-inline-heading="3">Examples</span></p>
<p></p>
<p><span class="heading heading-3" data-inline-heading="3">Questions</span></p>
<ul>
<li><p> </p></li>
</ul>
<p><span class="heading heading-2" data-inline-heading="2">Summary</span></p>
<p></p>`
  )
}

/** Rich HTML for blog posts (natural-language WYSIWYG). */
function htmlBlogPostBody(dateLine: string): string {
  return (
    `<blockquote><p><em>Add a compelling subtitle for readers…</em></p></blockquote>
<p><strong>Author</strong> — </p>
<p><strong>Date</strong> — ${dateLine}</p>
<p><strong>Tags</strong> — </p>
<hr>
<p><span class="heading heading-2" data-inline-heading="2">Hook</span></p>
<p></p>
<p><span class="heading heading-2" data-inline-heading="2">Main Point</span></p>
<p></p>
<p><span class="heading heading-2" data-inline-heading="2">Supporting Sections</span></p>
<p><span class="heading heading-3" data-inline-heading="3">First angle</span></p>
<p></p>
<p><span class="heading heading-3" data-inline-heading="3">Second angle</span></p>
<p></p>
<p><span class="heading heading-3" data-inline-heading="3">Third angle</span></p>
<p></p>
<p><span class="heading heading-2" data-inline-heading="2">Closing</span></p>
<p></p>`
  )
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
        body: htmlDailyLectureBody(today),
      }
    },
  },
  {
    id: 'research-paper',
    label: 'Research paper',
    shortLabel: 'Research',
    category: 'research',
    hint: 'Markdown source + live LaTeX preview for formal papers',
    folder: 'Research',
    tags: ['research', 'paper'],
    build: () => ({
      title: 'Research Paper Draft',
      editorMode: 'latex',
      body: mdResearchPaperBody(),
    }),
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
        body: htmlBlogPostBody(today),
      }
    },
  },
]

const defById = new Map(
  NOTE_TEMPLATE_DEFINITIONS.map((d) => [d.id, d] as const)
)

export function getNoteTemplatePayload(
  id: NoteTemplateId,
  _options?: NoteTemplateOptions
): NoteTemplatePayload {
  void _options
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

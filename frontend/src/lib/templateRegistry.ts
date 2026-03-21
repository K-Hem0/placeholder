import type { NoteTemplateId } from '../types'

export type TemplateCategoryId =
  | 'core'
  | 'research'
  | 'writing'
  | 'technical'
  | 'latex'

export type TemplateMeta = {
  id: NoteTemplateId
  label: string
  shortLabel: string
  category: TemplateCategoryId
  /** Short hint for picker rows */
  hint?: string
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategoryId, string> = {
  core: 'Core',
  research: 'Research',
  writing: 'Writing',
  technical: 'Technical',
  latex: 'LaTeX',
}

/**
 * Curated “Suggested” chips inside the template picker (blank stays one-click on the sidebar).
 */
export const SUGGESTED_TEMPLATE_IDS: NoteTemplateId[] = [
  'literature',
  'lecture-notes',
  'research-log',
  'daily-note',
]

export const TEMPLATE_REGISTRY: TemplateMeta[] = [
  {
    id: 'blank',
    label: 'Blank note',
    shortLabel: 'Blank',
    category: 'core',
    hint: 'Start from scratch',
  },
  {
    id: 'daily-note',
    label: 'Daily note',
    shortLabel: 'Daily',
    category: 'core',
    hint: 'Priorities & log',
  },
  {
    id: 'lecture-notes',
    label: 'Lecture notes',
    shortLabel: 'Lecture',
    category: 'core',
    hint: 'In class capture',
  },
  {
    id: 'literature',
    label: 'Literature note',
    shortLabel: 'Literature',
    category: 'research',
    hint: 'Papers & claims',
  },
  {
    id: 'research-log',
    label: 'Research log',
    shortLabel: 'Log',
    category: 'research',
    hint: 'Questions & next steps',
  },
  {
    id: 'annotated-bibliography',
    label: 'Annotated bibliography',
    shortLabel: 'Bibliography',
    category: 'research',
    hint: 'Citations with notes',
  },
  {
    id: 'essay-outline',
    label: 'Essay outline',
    shortLabel: 'Essay',
    category: 'writing',
    hint: 'Thesis & sections',
  },
  {
    id: 'reflection',
    label: 'Reflection',
    shortLabel: 'Reflection',
    category: 'writing',
    hint: 'Personal synthesis',
  },
  {
    id: 'meeting-notes',
    label: 'Meeting notes',
    shortLabel: 'Meeting',
    category: 'writing',
    hint: 'Decisions & owners',
  },
  {
    id: 'coding-notes',
    label: 'Coding notes',
    shortLabel: 'Coding',
    category: 'technical',
    hint: 'Snippets & APIs',
  },
  {
    id: 'bug-log',
    label: 'Bug log',
    shortLabel: 'Bugs',
    category: 'technical',
    hint: 'Repro & fixes',
  },
  {
    id: 'math-proof',
    label: 'Math proof',
    shortLabel: 'Proof',
    category: 'technical',
    hint: 'Claim & steps',
  },
  {
    id: 'latex-article',
    label: 'LaTeX article',
    shortLabel: 'Article',
    category: 'latex',
    hint: 'Manuscript starter',
  },
  {
    id: 'latex-homework',
    label: 'LaTeX homework',
    shortLabel: 'Homework',
    category: 'latex',
    hint: 'Problem sets',
  },
  {
    id: 'latex-proof',
    label: 'LaTeX proof',
    shortLabel: 'LaTeX proof',
    category: 'latex',
    hint: 'Theorem blocks',
  },
]

const byId = new Map(
  TEMPLATE_REGISTRY.map((m) => [m.id, m] as const)
)

export function getTemplateMeta(id: NoteTemplateId): TemplateMeta {
  return byId.get(id) ?? TEMPLATE_REGISTRY[0]!
}

export const ALL_TEMPLATE_IDS: NoteTemplateId[] = TEMPLATE_REGISTRY.map(
  (m) => m.id
)

const VALID_IDS = new Set<string>(ALL_TEMPLATE_IDS)

export function isNoteTemplateId(v: string): v is NoteTemplateId {
  return VALID_IDS.has(v)
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

const CATEGORY_ORDER: TemplateCategoryId[] = [
  'core',
  'research',
  'writing',
  'technical',
  'latex',
]

export function listCategoryOrder(): TemplateCategoryId[] {
  return [...CATEGORY_ORDER]
}

function h(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function getTemplateHtml(
  id: NoteTemplateId
): { title: string; html: string } {
  switch (id) {
    case 'literature':
      return {
        title: 'Literature note',
        html:
          '<h2>Source</h2><p>Authors, year, venue</p>' +
          '<h2>Claim</h2><p>One-sentence summary of the main contribution.</p>' +
          '<h2>Evidence</h2><p>Key figures, methods, or data relevant to you.</p>' +
          '<h2>Links</h2><p>Connect to related notes with [[note name]].</p>',
      }
    case 'research-log':
      return {
        title: 'Research log',
        html:
          '<h2>Question</h2><p>What are you trying to learn or decide?</p>' +
          '<h2>What I did</h2><p>Brief methods or reading steps.</p>' +
          '<h2>What I found</h2><p>Observations, surprises, dead ends.</p>' +
          '<h2>Next</h2><p>Concrete next step or follow-up.</p>',
      }
    case 'daily-note':
      return {
        title: '',
        html:
          '<h2>Focus</h2><p>Top 1–3 things that matter today.</p>' +
          '<h2>Log</h2><ul><li></li></ul>' +
          '<h2>Capture</h2><p>Ideas, links, or follow-ups.</p>',
      }
    case 'lecture-notes':
      return {
        title: 'Lecture notes',
        html:
          '<p><strong>Course · Date</strong></p>' +
          '<h2>Key ideas</h2><ul><li></li></ul>' +
          '<h2>Details</h2><p></p>' +
          '<h2>Questions</h2><p></p>',
      }
    case 'annotated-bibliography':
      return {
        title: 'Annotated entry',
        html:
          '<p><strong>Citation</strong> — APA / BibTeX key</p>' +
          '<h2>Summary</h2><p>2–4 sentences.</p>' +
          '<h2>Relevance</h2><p>Why this matters to your project.</p>' +
          '<h2>Quotes</h2><blockquote><p></p></blockquote>',
      }
    case 'essay-outline':
      return {
        title: 'Essay outline',
        html:
          '<h2>Thesis</h2><p>One clear sentence.</p>' +
          '<h2>Outline</h2><ol><li><p>Section I</p></li><li><p>Section II</p></li><li><p>Section III</p></li></ol>' +
          '<h2>Evidence</h2><p>Sources or examples to weave in.</p>',
      }
    case 'reflection':
      return {
        title: 'Reflection',
        html:
          '<h2>Context</h2><p>What prompted this reflection?</p>' +
          '<h2>What stood out</h2><p></p>' +
          '<h2>So what</h2><p>Implications or lessons.</p>',
      }
    case 'meeting-notes':
      return {
        title: 'Meeting notes',
        html:
          '<p><strong>Attendees · Date</strong></p>' +
          '<h2>Agenda</h2><ul><li></li></ul>' +
          '<h2>Decisions</h2><ul><li></li></ul>' +
          '<h2>Action items</h2><ul><li></li></ul>',
      }
    case 'coding-notes':
      return {
        title: 'Coding notes',
        html:
          '<h2>Goal</h2><p>What you are building or debugging.</p>' +
          '<h2>API / usage</h2><pre><code>// snippet</code></pre>' +
          '<h2>Notes</h2><p>Edge cases, pitfalls, links.</p>',
      }
    case 'bug-log':
      return {
        title: 'Bug',
        html:
          '<h2>Symptom</h2><p>What breaks, where, and how often.</p>' +
          '<h2>Repro</h2><ol><li></li></ol>' +
          '<h2>Hypothesis</h2><p></p>' +
          '<h2>Fix</h2><p></p>',
      }
    case 'math-proof':
      return {
        title: 'Proof',
        html:
          '<p><strong>Claim</strong> — state the precise statement.</p>' +
          '<h2>Proof sketch</h2><p>High-level strategy.</p>' +
          '<h2>Steps</h2><ol><li></li></ol>' +
          '<h2>Remarks</h2><p>Special cases or references.</p>',
      }
    case 'latex-article':
      return {
        title: 'LaTeX article',
        html:
          '<pre><code>' +
          h(
            '\\documentclass{article}\n\\title{Title}\n\\author{}\n\\begin{document}\n\\maketitle\n\\section{Introduction}\n\n\\end{document}'
          ) +
          '</code></pre>' +
          '<p>Body text below if you prefer rich editing first.</p>',
      }
    case 'latex-homework':
      return {
        title: 'Homework',
        html:
          '<pre><code>' +
          h(
            '\\documentclass{article}\n\\usepackage{amsmath,amssymb}\n\\begin{document}\n\\section*{Problem 1}\n\n\\end{document}'
          ) +
          '</code></pre>' +
          '<h2>Scratch</h2><p></p>',
      }
    case 'latex-proof':
      return {
        title: 'LaTeX proof',
        html:
          '<pre><code>' +
          h(
            '\\begin{theorem}\n\n\\end{theorem}\n\\begin{proof}\n\n\\end{proof}'
          ) +
          '</code></pre>' +
          '<p>Narrative notes around the formal block.</p>',
      }
    case 'blank':
    default:
      return { title: '', html: '<p></p>' }
  }
}

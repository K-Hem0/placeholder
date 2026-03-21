import type { Note, NoteSort } from '../types'

export function sortNotesList(notes: Note[], sort: NoteSort): Note[] {
  const copy = [...notes]
  if (sort === 'title') {
    return copy.sort((a, b) =>
      (a.title || 'Untitled').localeCompare(b.title || 'Untitled', undefined, {
        sensitivity: 'base',
      })
    )
  }
  if (sort === 'created') {
    return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

import type { NoteVersion } from '../types'

const MAX_VERSIONS_PER_NOTE = 40

export function appendVersion(
  existing: NoteVersion[] | undefined,
  content: string,
  previousContent: string,
  snapshotTitle?: string
): NoteVersion[] {
  const list = existing ?? []
  if (content === previousContent) return list
  const snap: NoteVersion = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    content: previousContent,
    ...(snapshotTitle !== undefined && snapshotTitle.trim() !== ''
      ? { snapshotTitle: snapshotTitle.trim() }
      : {}),
  }
  const next = [...list, snap]
  if (next.length > MAX_VERSIONS_PER_NOTE) {
    return next.slice(next.length - MAX_VERSIONS_PER_NOTE)
  }
  return next
}

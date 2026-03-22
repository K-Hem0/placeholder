import { useCallback, useId, useRef, useState, type ReactNode } from 'react'
import { useSettingsStore } from '../../store/useSettingsStore'
import { useAppStore } from '../../store/useAppStore'
import {
  exportStateMarkdown,
  parseImportedStateMarkdown,
  savePersistedState,
} from '../../lib/storage'
import { STORAGE_ROOT_KEY } from '../../lib/schema'
import { cn } from '../../lib/cn'
import { SelectMenu } from '../ui/SelectMenu'
import type {
  ColorSchemeId,
  EditorMaxWidth,
  NoteSort,
  ThemePreference,
} from '../../types'
import { ShortcutsList } from '../shortcuts/ShortcutsList'
import { isApplePlatform, modSymbol } from '../../lib/platformKeys'

export function SettingsModal() {
  const open = useSettingsStore((s) => s.settingsOpen)
  const setOpen = useSettingsStore((s) => s.setSettingsOpen)
  const colorScheme = useSettingsStore((s) => s.colorScheme)
  const titleId = useId()
  const isWildWest = colorScheme === 'wildwest'

  if (!open) return null

  return (
    <div
      className="modal-backdrop-enter fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/25 px-4 py-10 backdrop-blur-[2px] dark:bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        aria-label="Close settings"
        className="fixed inset-0 cursor-default"
        onClick={() => setOpen(false)}
      />
      <div
        data-theme={isWildWest ? 'wildwest' : undefined}
        className={cn(
          'modal-panel-enter relative z-10 mt-0 w-full max-w-lg rounded-2xl border p-6',
          !isWildWest &&
            'border-slate-200/70 bg-[#fbfaf7] shadow-[0_24px_80px_-20px_rgba(15,23,42,0.18)] dark:border-white/[0.06] dark:bg-[#15161d] dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)]',
          isWildWest &&
            'border-amber-900/30 bg-[#faf5ed] shadow-[0_24px_80px_-20px_rgba(101,67,33,0.25)] dark:border-amber-800/25 dark:bg-[#1f1915] dark:shadow-[0_24px_80px_-20px_rgba(0,0,0,0.7)]'
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2
            id={titleId}
            className="shrink-0 pr-2 text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
          >
            Settings
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={cn(
              'rounded-lg px-2 py-1 text-[13px] text-slate-500 transition-colors duration-150',
              'hover:bg-slate-200/60 hover:text-slate-800',
              'dark:hover:bg-white/[0.06] dark:hover:text-slate-200'
            )}
          >
            Done
          </button>
        </div>

        <div className="scroll-smooth max-h-[min(70dvh,560px)] space-y-8 overflow-y-auto pr-1">
          <AppearanceSection />
          <EditorSection />
          <NotesSection />
          <KeyboardShortcutsSection />
          <AdvancedSection />
        </div>

      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-500/90">
      {children}
    </h3>
  )
}

function Row({
  label,
  description,
  children,
}: {
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <div className="text-[13px] font-medium text-slate-800 dark:text-slate-200/95">
          {label}
        </div>
        {description ? (
          <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500 dark:text-slate-500/85">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function AppearanceSection() {
  const themePreference = useSettingsStore((s) => s.themePreference)
  const setTheme = useSettingsStore((s) => s.setThemePreference)
  const colorScheme = useSettingsStore((s) => s.colorScheme)
  const setColorScheme = useSettingsStore((s) => s.setColorScheme)

  return (
    <section className="space-y-4">
      <SectionTitle>Appearance</SectionTitle>
      <div className="space-y-4 rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
        <Row label="Theme" description="Match the app to your environment.">
          <Segmented<ThemePreference>
            value={themePreference}
            onChange={setTheme}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />
        </Row>
        <Row
          label="Color scheme"
          description="Subtle surface tint for the workspace. Extend tokens as you experiment."
        >
          <SelectMenu
            value={colorScheme}
            onChange={(v) => setColorScheme(v as ColorSchemeId)}
            options={[
              { value: 'default', label: 'Default' },
              { value: 'slate', label: 'Slate' },
              { value: 'graphite', label: 'Graphite' },
              { value: 'indigo', label: 'Indigo' },
              { value: 'forest', label: 'Forest' },
              { value: 'rose', label: 'Rose' },
              { value: 'wildwest', label: 'Wild West' },
            ]}
            ariaLabel="Color scheme"
            variant="settings"
            searchable
          />
        </Row>
      </div>
    </section>
  )
}

function EditorSection() {
  const lineFocus = useSettingsStore((s) => s.lineFocus)
  const setLineFocus = useSettingsStore((s) => s.setLineFocus)
  const distractionFree = useSettingsStore((s) => s.distractionFree)
  const setDf = useSettingsStore((s) => s.setDistractionFreeWithTransition)
  const editorMaxWidth = useSettingsStore((s) => s.editorMaxWidth)
  const setMaxW = useSettingsStore((s) => s.setEditorMaxWidth)

  return (
    <section className="space-y-4">
      <SectionTitle>Editor</SectionTitle>
      <div className="space-y-4 rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
        <Row
          label="Editor width"
          description="How wide the writing column should be."
        >
          <SelectMenu
            value={editorMaxWidth}
            onChange={(v) => setMaxW(v as EditorMaxWidth)}
            options={[
              { value: 'narrow', label: 'Narrow' },
              { value: 'medium', label: 'Medium' },
              { value: 'wide', label: 'Wide' },
            ]}
            ariaLabel="Editor width"
            variant="settings"
          />
        </Row>
        <Row
          label="Line focus"
          description="Dim surrounding paragraphs while you type."
        >
          <Toggle
            pressed={lineFocus}
            onPressedChange={setLineFocus}
            ariaLabel="Line focus"
          />
        </Row>
        <Row
          label="Distraction-free"
          description="Hide sidebars and expand the editor."
        >
          <Toggle
            pressed={distractionFree}
            onPressedChange={setDf}
            ariaLabel="Distraction-free mode"
          />
        </Row>
      </div>
    </section>
  )
}

function KeyboardShortcutsSection() {
  return (
    <section className="space-y-4">
      <SectionTitle>Keyboard shortcuts</SectionTitle>
      <div className="rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
        <p className="mb-4 text-[12px] leading-relaxed text-slate-500 dark:text-slate-500/85">
          The primary modifier is {modSymbol()}
          {isApplePlatform() ? ' (Command)' : ' (Control)'}. Formatting shortcuts
          apply while the cursor is in the editor.
        </p>
        <ShortcutsList />
      </div>
    </section>
  )
}

function NotesSection() {
  const sortNotes = useSettingsStore((s) => s.sortNotes)
  const setSort = useSettingsStore((s) => s.setSortNotes)
  const confirm = useSettingsStore((s) => s.confirmBeforeDelete)
  const setConfirm = useSettingsStore((s) => s.setConfirmBeforeDelete)

  return (
    <section className="space-y-4">
      <SectionTitle>Notes</SectionTitle>
      <div className="space-y-4 rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
        <Row label="Sort by" description="Order of items in the notes list.">
          <SelectMenu
            value={sortNotes}
            onChange={(v) => setSort(v as NoteSort)}
            options={[
              { value: 'updated', label: 'Updated' },
              { value: 'created', label: 'Created' },
              { value: 'title', label: 'Title' },
            ]}
            ariaLabel="Sort notes by"
            variant="settings"
            searchable
          />
        </Row>
        <Row
          label="Confirm before delete"
          description="Ask before removing a note."
        >
          <Toggle
            pressed={confirm}
            onPressedChange={setConfirm}
            ariaLabel="Confirm before delete"
          />
        </Row>
      </div>
    </section>
  )
}

function AdvancedSection() {
  const notes = useAppStore((s) => s.notes)
  const currentNoteId = useAppStore((s) => s.currentNoteId)
  const importState = useAppStore((s) => s.importState)
  const resetAll = useAppStore((s) => s.resetAll)
  const fileRef = useRef<HTMLInputElement>(null)
  const [resetBusy, setResetBusy] = useState(false)

  const onExport = useCallback(() => {
    const md = exportStateMarkdown({ notes, currentNoteId })
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `daftar-export-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [notes, currentNoteId])

  const onImportFile: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const parsed = parseImportedStateMarkdown(text)
      if (parsed) {
        importState(parsed.notes, {}, parsed.currentNoteId)
        const s = useAppStore.getState()
        savePersistedState({
          notes: s.notes,
          versionsByNoteId: s.versionsByNoteId,
          currentNoteId: s.currentNoteId,
          referencesByNoteId: s.referencesByNoteId,
        })
      }
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  const onReset = () => {
    if (
      !window.confirm(
        'Reset all notes and version history? This cannot be undone.'
      )
    ) {
      return
    }
    if (
      !window.confirm(
        'This will clear app data from this browser. Continue?'
      )
    ) {
      return
    }
    setResetBusy(true)
    try {
      localStorage.removeItem(STORAGE_ROOT_KEY)
      localStorage.removeItem('notes')
      resetAll()
      savePersistedState({
        notes: [],
        versionsByNoteId: {},
        currentNoteId: null,
        referencesByNoteId: {},
      })
    } finally {
      setResetBusy(false)
    }
  }

  return (
    <section className="space-y-4">
      <SectionTitle>Advanced</SectionTitle>
      <div className="space-y-4 rounded-xl border border-slate-200/60 bg-white/50 p-4 dark:border-white/[0.05] dark:bg-white/[0.02]">
        <Row
          label="Export notes"
          description="Download markdown (.md) with all notes."
        >
          <button type="button" onClick={onExport} className={btnSecondary}>
            Export .md
          </button>
        </Row>
        <Row
          label="Import notes"
          description="Replace local data with a markdown (.md) file."
        >
          <input
            ref={fileRef}
            type="file"
            accept=".md,text/markdown"
            className="hidden"
            onChange={onImportFile}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={btnSecondary}
          >
            Import .md
          </button>
        </Row>
        <Row
          label="Reset app data"
          description="Clear notes and history stored in this browser."
        >
          <button
            type="button"
            disabled={resetBusy}
            onClick={onReset}
            className={cn(
              'rounded-lg border border-red-200/80 bg-white px-3 py-1.5 text-[13px] font-medium',
              'text-red-700 hover:bg-red-50',
              'dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50',
              'disabled:opacity-50'
            )}
          >
            Reset…
          </button>
        </Row>
      </div>
    </section>
  )
}

const btnSecondary = cn(
  'rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-[13px] font-medium',
  'text-slate-700 shadow-sm transition hover:bg-slate-50',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
  'dark:border-white/[0.08] dark:bg-[#1a1b22] dark:text-slate-200 dark:hover:bg-white/[0.04]',
  'dark:focus-visible:ring-sky-400/20'
)

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <div
      className={cn(
        'inline-flex rounded-xl border border-slate-200/75 bg-slate-100/45 p-0.5',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]',
        'dark:border-white/[0.08] dark:bg-white/[0.04] dark:shadow-none'
      )}
      role="group"
    >
      {options.map((o) => {
        const active = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150 ease-out',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
              'dark:focus-visible:ring-sky-400/20',
              active
                ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(15,23,42,0.08)] dark:bg-[#23242f] dark:text-slate-100 dark:shadow-[0_2px_8px_rgba(0,0,0,0.35)]'
                : 'text-slate-500 hover:bg-white/50 hover:text-slate-800 dark:text-slate-500 dark:hover:bg-white/[0.04] dark:hover:text-slate-200'
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({
  pressed,
  onPressedChange,
  ariaLabel,
}: {
  pressed: boolean
  onPressedChange: (v: boolean) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={pressed}
      aria-label={ariaLabel}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'relative h-7 w-11 rounded-full transition',
        pressed
          ? 'bg-sky-600 dark:bg-sky-500/80'
          : 'bg-slate-200 dark:bg-slate-700'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition',
          pressed ? 'left-[1.375rem]' : 'left-0.5'
        )}
      />
    </button>
  )
}

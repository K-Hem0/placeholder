import { useSettingsStore } from '../../store/useSettingsStore'
import { cn } from '../../lib/cn'
import { EditorHelpPopover } from '../editor/EditorHelpPopover'

const railBtn = cn(
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-[5px] transition',
  'text-slate-500 hover:bg-slate-200/65 hover:text-slate-800',
  'active:bg-slate-200/75 dark:active:bg-white/[0.09]',
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
  'dark:text-slate-500 dark:hover:bg-white/[0.07] dark:hover:text-slate-200',
  'dark:focus-visible:ring-sky-400/20'
)

export function LeftIconRail() {
  const leftCollapsed = useSettingsStore((s) => s.leftSidebarCollapsed)
  const setLeftCollapsed = useSettingsStore((s) => s.setLeftSidebarCollapsed)
  const setSettingsOpen = useSettingsStore((s) => s.setSettingsOpen)

  return (
    <nav
      className={cn(
        'flex h-full min-h-0 w-9 shrink-0 flex-col border-r',
        'border-[color:var(--app-sidebar-border)] bg-[var(--app-rail)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]',
        'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'
      )}
      aria-label="Workspace"
    >
      <div className="flex flex-col items-center gap-0.5 px-1 pt-1.5">
        <button
          type="button"
          className={railBtn}
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          aria-pressed={leftCollapsed}
          aria-label={
            leftCollapsed ? 'Expand notes sidebar' : 'Collapse notes sidebar'
          }
          title={leftCollapsed ? 'Show notes' : 'Hide notes'}
        >
          {leftCollapsed ? <ChevronRightIcon /> : <PanelLeftIcon />}
        </button>
        <div
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md',
            'bg-slate-200/55 text-slate-700',
            'dark:bg-white/[0.07] dark:text-slate-300'
          )}
          title="Notes"
          aria-hidden
        >
          <NotesStackIcon />
        </div>
      </div>

      <div className="min-h-0 flex-1" aria-hidden />

      <div className="flex flex-col items-center gap-0.5 px-1 pb-1.5">
        <button
          type="button"
          className={railBtn}
          onClick={() => setSettingsOpen(true)}
          aria-label="Open settings"
          title="Settings"
        >
          <SettingsGearIcon />
        </button>
        <EditorHelpPopover variant="rail" />
      </div>
    </nav>
  )
}

function PanelLeftIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" />
      <path d="M15 12H9M15 8H9M15 16H9" strokeLinecap="round" />
      <path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M9 6 15 12l-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function NotesStackIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
    </svg>
  )
}

function SettingsGearIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  )
}

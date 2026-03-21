import { LiteratureTabPlaceholder } from '../sidebar/LiteratureTabPlaceholder'
import { ToolsTabPlaceholder } from '../sidebar/ToolsTabPlaceholder'
import { BacklinksPanel } from '../sidebar/BacklinksPanel'
import { VersionHistoryPanel } from '../sidebar/VersionHistoryPanel'
import { useAppStore } from '../../store'
import type { SidebarTab } from '../../types'
import { cn } from '../../lib/cn'
import { useSettingsStore } from '../../store/useSettingsStore'

const tabs: { id: SidebarTab; label: string }[] = [
  { id: 'literature', label: 'Literature' },
  { id: 'tools', label: 'Tools' },
  { id: 'backlinks', label: 'Backlinks' },
  { id: 'history', label: 'History' },
]

export function Sidebar() {
  const activeTab = useAppStore((s) => s.activeSidebarTab)
  const setActiveTab = useAppStore((s) => s.setActiveSidebarTab)
  const compactMode = useSettingsStore((s) => s.compactMode)
  const setRightCollapsed = useSettingsStore((s) => s.setRightSidebarCollapsed)

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div
        className={cn(
          'flex min-w-0 shrink-0 items-start justify-between gap-2 px-4 pb-5 pt-7',
          compactMode && 'px-3 pb-4 pt-6'
        )}
      >
        <div
          className="flex min-w-0 flex-1 flex-wrap gap-x-1 gap-y-1"
          role="tablist"
          aria-label="Sidebar panels"
        >
          {tabs.map(({ id, label }) => {
            const selected = activeTab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`sidebar-tab-${id}`}
                aria-selected={selected}
                aria-controls={`sidebar-panel-${id}`}
                onClick={() => setActiveTab(id)}
                className={cn(
                  'rounded-md px-2 py-1 text-[11px] font-medium transition',
                  selected
                    ? 'bg-slate-200/70 text-slate-900 dark:bg-white/[0.06] dark:text-slate-200'
                    : 'text-slate-500 hover:bg-slate-200/40 hover:text-slate-800 dark:text-slate-600 dark:hover:bg-white/[0.04] dark:hover:text-slate-300'
                )}
              >
                {label}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={() => setRightCollapsed(true)}
          className={cn(
            'mt-0.5 shrink-0 rounded-md p-1 text-slate-400 transition',
            'hover:bg-slate-200/50 hover:text-slate-700',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25',
            'dark:text-slate-600 dark:hover:bg-white/[0.06] dark:hover:text-slate-300',
            'dark:focus-visible:ring-sky-400/20'
          )}
          title="Hide right sidebar"
          aria-label="Collapse right sidebar"
        >
          <PanelRightCollapseIcon />
        </button>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-12">
        <div
          id="sidebar-panel-literature"
          role="tabpanel"
          aria-labelledby="sidebar-tab-literature"
          hidden={activeTab !== 'literature'}
        >
          <LiteratureTabPlaceholder />
        </div>
        <div
          id="sidebar-panel-tools"
          role="tabpanel"
          aria-labelledby="sidebar-tab-tools"
          hidden={activeTab !== 'tools'}
        >
          <ToolsTabPlaceholder />
        </div>
        <div
          id="sidebar-panel-backlinks"
          role="tabpanel"
          aria-labelledby="sidebar-tab-backlinks"
          hidden={activeTab !== 'backlinks'}
        >
          <BacklinksPanel />
        </div>
        <div
          id="sidebar-panel-history"
          role="tabpanel"
          aria-labelledby="sidebar-tab-history"
          hidden={activeTab !== 'history'}
        >
          <VersionHistoryPanel />
        </div>
      </div>
    </div>
  )
}

function PanelRightCollapseIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="M15 4H9a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h6" />
      <path d="M9 12h6M9 8h6M9 16h6" strokeLinecap="round" />
      <path d="M19 4v16" strokeLinecap="round" />
    </svg>
  )
}

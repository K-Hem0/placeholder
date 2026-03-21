import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  flushSettingsPersist,
  useSettingsStore,
} from '../../store/useSettingsStore'
import { SettingsModal } from '../settings/SettingsModal'
import { LeftIconRail } from './LeftIconRail'
import { ResizeDivider } from './ResizeDivider'
import { cn } from '../../lib/cn'
import {
  RAIL_WIDTH_PX,
  clampPaneWidths,
  defaultPaneWidths,
} from '../../lib/paneLayout'

type AppShellProps = {
  left: ReactNode
  editor: ReactNode
  right: ReactNode
}

export function AppShell({ left, editor, right }: AppShellProps) {
  const distractionFree = useSettingsStore((s) => s.distractionFree)
  const leftCollapsed = useSettingsStore((s) => s.leftSidebarCollapsed)
  const rightCollapsed = useSettingsStore((s) => s.rightSidebarCollapsed)
  const setRightCollapsed = useSettingsStore((s) => s.setRightSidebarCollapsed)
  const leftPaneWidthPx = useSettingsStore((s) => s.leftPaneWidthPx)
  const rightPaneWidthPx = useSettingsStore((s) => s.rightPaneWidthPx)
  const setLeftPaneWidthPx = useSettingsStore((s) => s.setLeftPaneWidthPx)
  const setRightPaneWidthPx = useSettingsStore((s) => s.setRightPaneWidthPx)
  const shellRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<'left' | 'right' | null>(null)

  const applyClamp = useCallback(() => {
    const el = shellRef.current
    if (!el) return
    const w = el.clientWidth
    const { leftPanePx, rightPanePx } = clampPaneWidths({
      containerWidth: w,
      railWidthPx: RAIL_WIDTH_PX,
      leftCollapsed,
      rightCollapsed,
      distractionFree,
      leftPanePx: leftPaneWidthPx,
      rightPanePx: rightPaneWidthPx,
    })
    if (leftPanePx !== leftPaneWidthPx || rightPanePx !== rightPaneWidthPx) {
      setLeftPaneWidthPx(leftPanePx, false)
      setRightPaneWidthPx(rightPanePx, false)
      flushSettingsPersist()
    }
  }, [
    distractionFree,
    leftCollapsed,
    rightCollapsed,
    leftPaneWidthPx,
    rightPaneWidthPx,
    setLeftPaneWidthPx,
    setRightPaneWidthPx,
  ])

  useLayoutEffect(() => {
    applyClamp()
  }, [applyClamp])

  useEffect(() => {
    const onResize = () => applyClamp()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [applyClamp])

  const endDragStyle = useCallback(() => {
    document.body.style.removeProperty('user-select')
    document.body.style.removeProperty('cursor')
  }, [])

  const onLeftDividerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (leftCollapsed || distractionFree) return
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startLeft = leftPaneWidthPx
      const startRight = rightPaneWidthPx
      setDragging('left')
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      const onMove = (ev: PointerEvent) => {
        const shell = shellRef.current
        if (!shell) return
        const delta = ev.clientX - startX
        const nextLeft = startLeft + delta
        const { leftPanePx, rightPanePx } = clampPaneWidths({
          containerWidth: shell.clientWidth,
          railWidthPx: RAIL_WIDTH_PX,
          leftCollapsed: false,
          rightCollapsed,
          distractionFree: false,
          leftPanePx: nextLeft,
          rightPanePx: startRight,
        })
        setLeftPaneWidthPx(leftPanePx, false)
        setRightPaneWidthPx(rightPanePx, false)
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        endDragStyle()
        setDragging(null)
        flushSettingsPersist()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [
      distractionFree,
      endDragStyle,
      leftCollapsed,
      rightCollapsed,
      leftPaneWidthPx,
      rightPaneWidthPx,
      setLeftPaneWidthPx,
      setRightPaneWidthPx,
    ]
  )

  const onRightDividerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (distractionFree || rightCollapsed) return
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const startLeft = leftPaneWidthPx
      const startRight = rightPaneWidthPx
      setDragging('right')
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      const onMove = (ev: PointerEvent) => {
        const shell = shellRef.current
        if (!shell) return
        const delta = ev.clientX - startX
        // Dragging the handle right expands the editor and narrows the right pane.
        const nextRight = startRight - delta
        const { leftPanePx, rightPanePx } = clampPaneWidths({
          containerWidth: shell.clientWidth,
          railWidthPx: RAIL_WIDTH_PX,
          leftCollapsed,
          rightCollapsed: false,
          distractionFree: false,
          leftPanePx: startLeft,
          rightPanePx: nextRight,
        })
        setLeftPaneWidthPx(leftPanePx, false)
        setRightPaneWidthPx(rightPanePx, false)
      }

      const onUp = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        endDragStyle()
        setDragging(null)
        flushSettingsPersist()
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [
      distractionFree,
      endDragStyle,
      leftCollapsed,
      rightCollapsed,
      leftPaneWidthPx,
      rightPaneWidthPx,
      setLeftPaneWidthPx,
      setRightPaneWidthPx,
    ]
  )

  const onLeftDividerDblClick = useCallback(() => {
    if (leftCollapsed || distractionFree) return
    const shell = shellRef.current
    const def = defaultPaneWidths()
    if (!shell) {
      setLeftPaneWidthPx(def.leftPanePx)
      return
    }
    const { leftPanePx, rightPanePx } = clampPaneWidths({
      containerWidth: shell.clientWidth,
      railWidthPx: RAIL_WIDTH_PX,
      leftCollapsed: false,
      rightCollapsed,
      distractionFree: false,
      leftPanePx: def.leftPanePx,
      rightPanePx: rightPaneWidthPx,
    })
    setLeftPaneWidthPx(leftPanePx)
    setRightPaneWidthPx(rightPanePx)
  }, [
    distractionFree,
    leftCollapsed,
    rightCollapsed,
    rightPaneWidthPx,
    setLeftPaneWidthPx,
    setRightPaneWidthPx,
  ])

  const onRightDividerDblClick = useCallback(() => {
    if (distractionFree || rightCollapsed) return
    const shell = shellRef.current
    const def = defaultPaneWidths()
    if (!shell) {
      setRightPaneWidthPx(def.rightPanePx)
      return
    }
    const { leftPanePx, rightPanePx } = clampPaneWidths({
      containerWidth: shell.clientWidth,
      railWidthPx: RAIL_WIDTH_PX,
      leftCollapsed,
      rightCollapsed: false,
      distractionFree: false,
      leftPanePx: leftPaneWidthPx,
      rightPanePx: def.rightPanePx,
    })
    setLeftPaneWidthPx(leftPanePx)
    setRightPaneWidthPx(rightPanePx)
  }, [
    distractionFree,
    leftCollapsed,
    leftPaneWidthPx,
    rightCollapsed,
    setLeftPaneWidthPx,
    setRightPaneWidthPx,
  ])

  return (
    <div
      className={cn(
        'flex h-full min-h-0 w-full flex-1 flex-col font-sans antialiased',
        'bg-[var(--app-bg)] text-slate-800',
        'selection:bg-sky-200/70 selection:text-slate-900',
        'dark:text-slate-200/95 dark:selection:bg-sky-500/20 dark:selection:text-slate-50'
      )}
    >
      {distractionFree ? (
        <header
          className={cn(
            'relative z-30 flex h-10 shrink-0 items-center justify-end border-b px-3',
            'border-[color:var(--app-chrome-border)] bg-[var(--app-chrome)] backdrop-blur-sm',
            'shadow-[0_1px_0_rgba(15,23,42,0.05),0_12px_32px_-20px_rgba(15,23,42,0.1)]',
            'dark:shadow-[0_1px_0_rgba(0,0,0,0.4),0_12px_36px_-22px_rgba(0,0,0,0.5)]'
          )}
        >
          <button
            type="button"
            onClick={() =>
              useSettingsStore.getState().setDistractionFree(false)
            }
            className={cn(
              'rounded-lg px-3 py-1.5 text-[12px] font-medium',
              'text-slate-600 transition',
              'hover:bg-slate-200/60 hover:text-slate-900',
              'dark:text-slate-400 dark:hover:bg-white/[0.06] dark:hover:text-slate-100',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25 dark:focus-visible:ring-sky-400/20'
            )}
          >
            Exit focus
          </button>
        </header>
      ) : (
        <WorkspaceTopChrome />
      )}

      <div
        ref={shellRef}
        className={cn(
          'relative flex min-h-0 flex-1 flex-row overflow-hidden',
          !distractionFree &&
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.48)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]'
        )}
      >
        {!distractionFree ? (
          <>
            <LeftIconRail />
            <aside
              className={cn(
                'relative flex shrink-0 flex-col overflow-hidden',
                'border-r border-[color:var(--app-sidebar-border)] bg-[var(--app-sidebar)]',
                'shadow-[1px_0_0_rgba(15,23,42,0.03)]',
                'dark:shadow-[1px_0_0_rgba(255,255,255,0.02)]',
                leftCollapsed ? 'w-0 border-transparent' : ''
              )}
              style={
                leftCollapsed
                  ? undefined
                  : { width: leftPaneWidthPx, transition: 'none' }
              }
              aria-hidden={leftCollapsed}
            >
              <div className="flex h-full min-h-0 w-full min-w-0 flex-col">
                {left}
              </div>
            </aside>

            {!leftCollapsed ? (
              <ResizeDivider
                label="Resize notes and editor"
                active={dragging === 'left'}
                onPointerDown={onLeftDividerDown}
                onDoubleClick={onLeftDividerDblClick}
              />
            ) : null}

            <main
              className={cn(
                'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
                'bg-[var(--app-main)]'
              )}
            >
              {editor}
              {rightCollapsed ? (
                <button
                  type="button"
                  onClick={() => setRightCollapsed(false)}
                  className={cn(
                    'absolute right-0 top-1/2 z-20 -translate-y-1/2',
                    'flex h-14 w-6 items-center justify-center rounded-l-lg border border-r-0',
                    'border-[color:var(--app-sidebar-border)] bg-[var(--app-sidebar)]/95 shadow-sm',
                    'text-slate-500 transition hover:bg-slate-200/50 hover:text-slate-800',
                    'dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-slate-200',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/25 dark:focus-visible:ring-sky-400/20'
                  )}
                  title="Show right sidebar"
                  aria-label="Expand right sidebar"
                >
                  <ChevronLeftMiniIcon />
                </button>
              ) : null}
            </main>

            {!rightCollapsed ? (
              <ResizeDivider
                label="Resize editor and right sidebar"
                active={dragging === 'right'}
                onPointerDown={onRightDividerDown}
                onDoubleClick={onRightDividerDblClick}
              />
            ) : null}

            <aside
              className={cn(
                'relative flex min-h-0 min-w-0 shrink-0 flex-col overflow-hidden',
                'border-l border-[color:var(--app-sidebar-border)] bg-[var(--app-sidebar)]',
                'shadow-[-1px_0_0_rgba(15,23,42,0.03)]',
                'dark:shadow-[-1px_0_0_rgba(255,255,255,0.02)]',
                rightCollapsed ? 'w-0 border-transparent shadow-none' : ''
              )}
              style={
                rightCollapsed
                  ? undefined
                  : { width: rightPaneWidthPx, transition: 'none' }
              }
              aria-hidden={rightCollapsed}
            >
              <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                {right}
              </div>
            </aside>
          </>
        ) : (
          <main
            className={cn(
              'relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
              'bg-[var(--app-main)]',
              'opacity-[0.99]'
            )}
          >
            {editor}
          </main>
        )}
      </div>

      <SettingsModal />
    </div>
  )
}

function WorkspaceTopChrome() {
  return (
    <header
      className={cn(
        'relative z-30 flex h-9 shrink-0 items-stretch',
        'border-b border-[color:var(--app-chrome-border)] bg-[var(--app-chrome)]',
        'shadow-[0_1px_0_rgba(15,23,42,0.05),0_12px_32px_-20px_rgba(15,23,42,0.1)]',
        'dark:shadow-[0_1px_0_rgba(0,0,0,0.45),0_12px_36px_-22px_rgba(0,0,0,0.55)]'
      )}
      role="banner"
      aria-label="Workspace"
    >
      <div
        className={cn(
          'flex w-9 shrink-0 items-center justify-center border-r',
          'border-[color:var(--app-sidebar-border)] bg-[var(--app-rail)]',
          'shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]',
          'dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
        )}
        aria-hidden
      />
      <div className="flex min-h-0 min-w-0 flex-1 items-center px-3">
        <span
          className={cn(
            'truncate text-[11px] font-medium tracking-[0.1em] text-slate-400/90 uppercase',
            'dark:text-slate-500/85'
          )}
        >
          Workspace
        </span>
      </div>
    </header>
  )
}

function ChevronLeftMiniIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path d="m15 6-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Icon rail (Tailwind `w-9` at default rem). */
export const RAIL_WIDTH_PX = 36

/** Layout width reserved for each vertical split handle (hit target). */
export const DIVIDER_WIDTH_PX = 6

export const MIN_LEFT_PANE_PX = 180
export const MIN_RIGHT_PANE_PX = 200
export const MIN_EDITOR_PX = 260

export const DEFAULT_LEFT_PANE_PX = 244
export const DEFAULT_RIGHT_PANE_PX = 268

function dividerCount(
  leftCollapsed: boolean,
  distractionFree: boolean,
  rightCollapsed: boolean
): number {
  if (distractionFree) return 0
  let n = 0
  if (!leftCollapsed) n += 1
  if (!rightCollapsed) n += 1
  return n
}

/**
 * Clamp stored / dragged pane widths so the editor keeps at least `MIN_EDITOR_PX`
 * when possible, shrinking side panes first (right, then left).
 */
export function clampPaneWidths(args: {
  containerWidth: number
  railWidthPx: number
  leftCollapsed: boolean
  rightCollapsed: boolean
  distractionFree: boolean
  leftPanePx: number
  rightPanePx: number
}): { leftPanePx: number; rightPanePx: number } {
  const {
    containerWidth,
    railWidthPx,
    leftCollapsed,
    rightCollapsed,
    distractionFree,
    leftPanePx,
    rightPanePx,
  } = args

  const divs = dividerCount(leftCollapsed, distractionFree, rightCollapsed)
  const divTotal = divs * DIVIDER_WIDTH_PX

  if (distractionFree) {
    return { leftPanePx, rightPanePx }
  }

  let l = leftCollapsed
    ? leftPanePx
    : Math.max(MIN_LEFT_PANE_PX, leftPanePx)
  let r = rightCollapsed
    ? rightPanePx
    : Math.max(MIN_RIGHT_PANE_PX, rightPanePx)

  const leftUsed = leftCollapsed ? 0 : l
  const rightUsed = rightCollapsed ? 0 : r
  let editor =
    containerWidth - railWidthPx - leftUsed - rightUsed - divTotal

  if (editor >= MIN_EDITOR_PX) {
    return { leftPanePx: l, rightPanePx: r }
  }

  let deficit = MIN_EDITOR_PX - editor

  if (!rightCollapsed && r > MIN_RIGHT_PANE_PX) {
    const take = Math.min(deficit, r - MIN_RIGHT_PANE_PX)
    r -= take
    deficit -= take
  }

  if (deficit > 0 && !leftCollapsed && l > MIN_LEFT_PANE_PX) {
    const take = Math.min(deficit, l - MIN_LEFT_PANE_PX)
    l -= take
    deficit -= take
  }

  const leftUsed2 = leftCollapsed ? 0 : l
  const rightUsed2 = rightCollapsed ? 0 : r
  editor = containerWidth - railWidthPx - leftUsed2 - rightUsed2 - divTotal

  if (editor < MIN_EDITOR_PX && !leftCollapsed && l > MIN_LEFT_PANE_PX) {
    const need = MIN_EDITOR_PX - editor
    l = Math.max(MIN_LEFT_PANE_PX, l - need)
  }

  return { leftPanePx: l, rightPanePx: r }
}

export function defaultPaneWidths(): {
  leftPanePx: number
  rightPanePx: number
} {
  return {
    leftPanePx: DEFAULT_LEFT_PANE_PX,
    rightPanePx: DEFAULT_RIGHT_PANE_PX,
  }
}

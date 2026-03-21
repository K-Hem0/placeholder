/** True when the primary modifier is ⌘ (macOS / iOS-style). */
export function isApplePlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  if (/Mac|iPhone|iPad|iPod/.test(navigator.platform)) return true
  return /Mac OS/.test(navigator.userAgent)
}

/** Ctrl on Windows/Linux; ⌘ on Apple platforms — use with `KeyboardEvent.code` matchers. */
export function isPrimaryModifier(e: KeyboardEvent): boolean {
  return isApplePlatform() ? e.metaKey : e.ctrlKey
}

/**
 * True when running inside a packaged shell (Electron/Tauri). Use for native menus,
 * window chrome, or shell-specific behavior—not for shortcut labels (the app is desktop-first;
 * labels always reflect the shipped shortcuts below).
 */
export function isDesktopShell(): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(
    (window as unknown as { __NOTES_DESKTOP_SHELL__?: boolean })
      .__NOTES_DESKTOP_SHELL__
  )
}

/** Modifier label for shortcuts (⌘ on Apple, Ctrl elsewhere). */
export function modSymbol(): string {
  return isApplePlatform() ? '⌘' : 'Ctrl'
}

function keyLabel(key: string): string {
  if (key === 'Backslash') return '\\'
  if (key === 'Backquote') return '`'
  if (key === 'Comma') return ','
  if (key === 'Period') return '.'
  if (key === 'Slash') return '/'
  return key.length === 1 ? key.toUpperCase() : key
}

/** Human-readable shortcut for UI (e.g. "Ctrl+N", "⌘⇧N"). */
export function formatShortcut(parts: string[]): string {
  if (!isApplePlatform()) return parts.join('+')
  return parts
    .map((p) => {
      if (p === 'Shift') return '⇧'
      if (p === 'Alt') return '⌥'
      return p
    })
    .join('')
}

/** New blank note — matches `keyboardShortcuts` / `useKeyboardShortcuts` (Mod+N). */
export function shortcutNewNote(): string {
  return formatShortcut([modSymbol(), 'N'])
}

export function shortcutTemplatePicker(): string {
  return formatShortcut([modSymbol(), 'Shift', 'N'])
}

export function shortcutSettings(): string {
  return formatShortcut([modSymbol(), ','])
}

export function shortcutToggleLeftSidebar(): string {
  const mod = modSymbol()
  const a = formatShortcut([mod, keyLabel('Backquote')])
  const b = formatShortcut([mod, keyLabel('Period')])
  return `${a} · ${b}`
}

export function shortcutToggleRightSidebar(): string {
  return formatShortcut([modSymbol(), keyLabel('Backslash')])
}

export function shortcutFocusMode(): string {
  return formatShortcut([modSymbol(), 'Shift', 'F'])
}

export function shortcutHeading(level: 1 | 2 | 3): string {
  return formatShortcut([modSymbol(), String(level)])
}

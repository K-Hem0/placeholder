/**
 * Global keyboard shortcuts — physical keys and matchers.
 * Labels for help/settings live in `platformKeys.ts` / `shortcutDefinitions.ts`.
 * Handlers: `hooks/useKeyboardShortcuts.ts`.
 *
 * Same bindings are intended for in-browser dev and packaged shells (Electron/Tauri);
 * native menus can mirror these via `isDesktopShell()` when wiring menus later.
 */
import { isPrimaryModifier } from './platformKeys'

export { isPrimaryModifier } from './platformKeys'

/** `KeyboardEvent.code` values used by global handlers (not `event.key` — layout-stable). */
export const GlobalKeyCode = {
  NewNote: 'KeyN',
  TemplatePicker: 'KeyN',
  Settings: 'Comma',
  ToggleLeftSidebarA: 'Backquote',
  ToggleLeftSidebarB: 'Period',
  ToggleRightSidebar: 'Backslash',
  FocusMode: 'KeyF',
  Heading1: 'Digit1',
  Heading2: 'Digit2',
  Heading3: 'Digit3',
  Bold: 'KeyB',
  Italic: 'KeyI',
  Underline: 'KeyU',
  Link: 'KeyK',
  UndoRedoZ: 'KeyZ',
  UndoRedoY: 'KeyY',
} as const

export function matchNewNote(e: KeyboardEvent): boolean {
  return (
    isPrimaryModifier(e) &&
    e.code === GlobalKeyCode.NewNote &&
    !e.shiftKey &&
    !e.altKey
  )
}

export function matchTemplatePicker(e: KeyboardEvent): boolean {
  return (
    isPrimaryModifier(e) &&
    e.code === GlobalKeyCode.TemplatePicker &&
    e.shiftKey &&
    !e.altKey
  )
}

export function matchSettings(e: KeyboardEvent): boolean {
  return (
    isPrimaryModifier(e) &&
    e.code === GlobalKeyCode.Settings &&
    !e.shiftKey &&
    !e.altKey
  )
}

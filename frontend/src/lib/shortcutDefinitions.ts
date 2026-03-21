/**
 * Keyboard shortcut list for Settings / Help. Labels: `platformKeys.ts` (Ctrl vs ⌘).
 * Physical keys and matchers: `keyboardShortcuts.ts`; handlers: `useKeyboardShortcuts.ts`.
 */
import {
  formatShortcut,
  isApplePlatform,
  modSymbol,
  shortcutFocusMode,
  shortcutHeading,
  shortcutNewNote,
  shortcutSettings,
  shortcutTemplatePicker,
  shortcutToggleLeftSidebar,
  shortcutToggleRightSidebar,
} from './platformKeys'

export type ShortcutDef = {
  id: string
  action: string
  keysLabel: string
}

function modKey(k: string): string {
  return formatShortcut([modSymbol(), k])
}

function undoRedoLabel(): string {
  const m = modSymbol()
  if (isApplePlatform()) {
    return `${m}Z · ${m}⇧Z`
  }
  return `${m}+Z · ${m}+Shift+Z · ${m}+Y`
}

export function getShortcutDefinitions(): ShortcutDef[] {
  return [
    { id: 'new-note', action: 'New note', keysLabel: shortcutNewNote() },
    {
      id: 'template-picker',
      action: 'Template picker',
      keysLabel: shortcutTemplatePicker(),
    },
    { id: 'settings', action: 'Settings', keysLabel: shortcutSettings() },
    { id: 'bold', action: 'Bold', keysLabel: modKey('B') },
    { id: 'italic', action: 'Italic', keysLabel: modKey('I') },
    { id: 'underline', action: 'Underline', keysLabel: modKey('U') },
    { id: 'link', action: 'Insert link', keysLabel: modKey('K') },
    {
      id: 'undo-redo',
      action: 'Undo / redo',
      keysLabel: undoRedoLabel(),
    },
    {
      id: 'h1',
      action: 'Heading 1 (in editor)',
      keysLabel: shortcutHeading(1),
    },
    {
      id: 'h2',
      action: 'Heading 2 (in editor)',
      keysLabel: shortcutHeading(2),
    },
    {
      id: 'h3',
      action: 'Heading 3 (in editor)',
      keysLabel: shortcutHeading(3),
    },
    {
      id: 'left-sidebar',
      action: 'Toggle notes sidebar',
      keysLabel: shortcutToggleLeftSidebar(),
    },
    {
      id: 'right-sidebar',
      action: 'Toggle tools sidebar',
      keysLabel: shortcutToggleRightSidebar(),
    },
    {
      id: 'focus',
      action: 'Distraction-free mode',
      keysLabel: shortcutFocusMode(),
    },
    {
      id: 'escape',
      action: 'Close dialog or menu',
      keysLabel: 'Escape',
    },
  ]
}

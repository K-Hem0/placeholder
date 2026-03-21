import { useEffect } from 'react'
import { useAppStore } from '../store'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUiStore } from '../store/useUiStore'
import { getEditorForShortcuts } from '../lib/editorShortcutBridge'
import {
  GlobalKeyCode,
  isPrimaryModifier,
  matchNewNote,
  matchSettings,
  matchTemplatePicker,
} from '../lib/keyboardShortcuts'

/**
 * Desktop-first shortcuts (Ctrl/Cmd). Physical keys and labels stay aligned via
 * `keyboardShortcuts.ts`, `platformKeys.ts`, and `shortcutDefinitions.ts`.
 *
 * Search fields and similar: skip global shortcuts so typing behaves predictably.
 */
function isShortcutIgnoredTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && !!target.closest('[data-shortcut-ignore]')
}

function targetInProseMirror(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement && !!target.closest?.('.ProseMirror')
  )
}

/**
 * When the caret is in the main editor, let TipTap handle these Mod shortcuts
 * so we do not run capture logic that could interfere with ProseMirror.
 */
function shouldLetEditorHandle(
  e: KeyboardEvent,
  inProse: boolean
): boolean {
  if (!inProse || !isPrimaryModifier(e)) return false
  const code = e.code
  if (code === 'KeyB' || code === 'KeyI' || code === 'KeyU') return !e.shiftKey
  if (code === 'KeyK' && !e.shiftKey) return true
  if (code === 'KeyZ') return true
  if (code === 'KeyY' && !e.shiftKey) return true
  return false
}

function closeTopOverlay(): boolean {
  const settings = useSettingsStore.getState()
  const ui = useUiStore.getState()
  if (settings.settingsOpen) {
    settings.setSettingsOpen(false)
    return true
  }
  if (ui.helpOpen) {
    ui.setHelpOpen(false)
    return true
  }
  if (ui.templatePickerOpen) {
    ui.setTemplatePickerOpen(false)
    return true
  }
  return false
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (e.repeat) return

      if (e.key === 'Escape') {
        if (closeTopOverlay()) {
          e.preventDefault()
          e.stopPropagation()
        }
        return
      }

      const inProse = targetInProseMirror(e.target)
      const ignored = isShortcutIgnoredTarget(e.target)

      if (isPrimaryModifier(e) && inProse && !ignored) {
        const code = e.code
        if (
          (code === GlobalKeyCode.Heading1 ||
            code === GlobalKeyCode.Heading2 ||
            code === GlobalKeyCode.Heading3) &&
          !e.shiftKey &&
          !e.altKey
        ) {
          const ed = getEditorForShortcuts()
          if (!ed) return
          const level =
            code === GlobalKeyCode.Heading1
              ? 1
              : code === GlobalKeyCode.Heading2
                ? 2
                : 3
          e.preventDefault()
          e.stopPropagation()
          ed.chain().focus().toggleHeading({ level }).run()
          return
        }
      }

      if (!isPrimaryModifier(e)) return

      if (shouldLetEditorHandle(e, inProse)) return

      const code = e.code

      if (matchNewNote(e)) {
        if (ignored) return
        e.preventDefault()
        e.stopPropagation()
        useAppStore.getState().addNote()
        useUiStore.getState().requestEditorPaneFocus()
        return
      }

      if (matchTemplatePicker(e)) {
        if (ignored) return
        e.preventDefault()
        e.stopPropagation()
        useUiStore.getState().setTemplatePickerOpen(true)
        return
      }

      if (matchSettings(e)) {
        if (ignored) return
        e.preventDefault()
        e.stopPropagation()
        useSettingsStore.getState().setSettingsOpen(true)
        return
      }

      if (
        (code === GlobalKeyCode.ToggleLeftSidebarA ||
          code === GlobalKeyCode.ToggleLeftSidebarB) &&
        !e.shiftKey &&
        !e.altKey
      ) {
        if (ignored) return
        e.preventDefault()
        e.stopPropagation()
        const s = useSettingsStore.getState()
        if (!s.distractionFree) {
          s.setLeftSidebarCollapsed(!s.leftSidebarCollapsed)
        }
        return
      }

      if (code === GlobalKeyCode.ToggleRightSidebar && !e.shiftKey) {
        if (ignored) return
        e.preventDefault()
        e.stopPropagation()
        const s = useSettingsStore.getState()
        if (!s.distractionFree) {
          s.setRightSidebarCollapsed(!s.rightSidebarCollapsed)
        }
        return
      }

      if (
        code === GlobalKeyCode.FocusMode &&
        e.shiftKey &&
        !e.altKey
      ) {
        if (ignored) return
        e.preventDefault()
        e.stopPropagation()
        const s = useSettingsStore.getState()
        s.setDistractionFree(!s.distractionFree)
        return
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])
}

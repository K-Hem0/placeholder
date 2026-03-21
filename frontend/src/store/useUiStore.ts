import { create } from 'zustand'

type UiState = {
  templatePickerOpen: boolean
  setTemplatePickerOpen: (open: boolean) => void
  helpOpen: boolean
  setHelpOpen: (open: boolean) => void
  /** Incremented when the editor pane should move focus after a new note (Mod+N). */
  focusToken: number
  requestEditorPaneFocus: () => void
}

export const useUiStore = create<UiState>((set) => ({
  templatePickerOpen: false,
  setTemplatePickerOpen: (open) => set({ templatePickerOpen: open }),
  helpOpen: false,
  setHelpOpen: (open) => set({ helpOpen: open }),
  focusToken: 0,
  requestEditorPaneFocus: () =>
    set((s) => ({
      focusToken: s.focusToken + 1,
    })),
}))

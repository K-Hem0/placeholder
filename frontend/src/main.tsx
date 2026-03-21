import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'tippy.js/dist/tippy.css'
import 'katex/dist/katex.min.css'
import App from './App.tsx'
import { useSettingsStore } from './store/useSettingsStore'
import { applyThemePreference } from './lib/theme'
import { applyColorScheme } from './lib/colorScheme'

applyThemePreference(useSettingsStore.getState().themePreference)
applyColorScheme(useSettingsStore.getState().colorScheme)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

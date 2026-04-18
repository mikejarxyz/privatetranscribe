import { useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark'

function getInitialThemeMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const storedMode = window.localStorage.getItem('private-transcribe-theme')

  if (storedMode === 'light' || storedMode === 'dark') {
    return storedMode
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)

  useEffect(() => {
    const shouldUseDark = themeMode === 'dark'

    document.documentElement.classList.toggle('dark', shouldUseDark)
    document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light'
    window.localStorage.setItem('private-transcribe-theme', themeMode)
  }, [themeMode])

  function toggleThemeMode() {
    setThemeMode((currentMode) =>
      currentMode === 'dark' ? 'light' : 'dark',
    )
  }

  return {
    themeMode,
    toggleThemeMode,
  }
}

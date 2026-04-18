import { Moon, Sun } from 'lucide-react'
import type { ThemeMode } from '../hooks/useThemeMode'
import { LogoMark } from './LogoMark'

type HeaderProps = {
  themeMode: ThemeMode
  onToggleTheme: () => void
}

export function Header({ themeMode, onToggleTheme }: HeaderProps) {
  const themeLabel =
    themeMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'

  return (
    <header className="flex items-center justify-between border-b border-zinc-300 px-4 py-3 text-sm dark:border-zinc-800 sm:px-6">
      <a
        className="flex cursor-pointer items-center gap-3 font-mono font-semibold tracking-normal"
        href="/"
      >
        <LogoMark className="block size-6 bg-lime-600 dark:bg-lime-400" />
        PrivateTranscribe.app
      </a>
      <nav className="flex items-center gap-4 text-xs text-zinc-600 dark:text-zinc-400">
        <a
          className="cursor-pointer hover:text-zinc-950 dark:hover:text-zinc-100"
          href="#features"
        >
          Features
        </a>
        <a
          className="cursor-pointer hover:text-zinc-950 dark:hover:text-zinc-100"
          href="#how-it-works"
        >
          How it works
        </a>
        <button
          aria-label={themeLabel}
          className="grid size-8 cursor-pointer place-items-center border border-zinc-300 bg-stone-50 text-zinc-600 transition hover:bg-white hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-1 focus:ring-offset-stone-50 dark:border-zinc-800 dark:bg-zinc-925 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 dark:focus:ring-offset-zinc-925"
          onClick={onToggleTheme}
          title={themeLabel}
          type="button"
        >
          {themeMode === 'dark' ? (
            <Sun aria-hidden="true" className="size-4" strokeWidth={1.75} />
          ) : (
            <Moon aria-hidden="true" className="size-4" strokeWidth={1.75} />
          )}
        </button>
      </nav>
    </header>
  )
}

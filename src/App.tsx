import { FooterSections } from './components/Footer'
import { Header } from './components/Header'
import { HeroSection } from './components/HeroSection'
import { MarketingSections } from './components/MarketingSections'
import { TranscriptionWorkspace } from './components/TranscriptionWorkspace'
import { useThemeMode } from './hooks/useThemeMode'
import { useTranscriptionController } from './hooks/useTranscriptionController'

function App() {
  const { themeMode, toggleThemeMode } = useThemeMode()
  const transcription = useTranscriptionController()

  return (
    <main className="min-h-screen bg-stone-100 text-zinc-950 selection:bg-lime-300 selection:text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-lime-400">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col border-x border-zinc-300 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-925">
        <Header onToggleTheme={toggleThemeMode} themeMode={themeMode} />
        <TranscriptionWorkspace controller={transcription} />
        <HeroSection />
        <MarketingSections />
        <FooterSections />
      </div>
    </main>
  )
}

export default App

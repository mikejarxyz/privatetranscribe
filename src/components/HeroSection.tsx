type HeroSectionProps = {
  onDemoTranscript: () => void
}

export function HeroSection({ onDemoTranscript }: HeroSectionProps) {
  return (
    <section className="grid grid-cols-1 gap-8 border-b border-zinc-300 px-4 py-12 dark:border-zinc-800 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-16">
      <div className="max-w-4xl">
        <h1 className="text-4xl font-semibold leading-[1.02] tracking-normal text-zinc-950 dark:text-zinc-50 sm:text-6xl">
          Private audio transcription.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-7 text-zinc-700 dark:text-zinc-300 sm:text-xl sm:leading-8">
          No upload, no account, offline-capable audio transcription in your
          browser.
        </p>
      </div>
      <div className="flex items-start lg:items-end">
        <button
          className="cursor-pointer border border-zinc-500 bg-white px-4 py-3 font-mono text-xs uppercase text-zinc-950 hover:bg-lime-50 focus:outline-none focus:ring-2 focus:ring-lime-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          onClick={onDemoTranscript}
          type="button"
        >
          Quick demo
        </button>
      </div>
    </section>
  )
}

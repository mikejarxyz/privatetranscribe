import { sitemapItems } from '../content/siteContent'
import GithubIcon from '../assets/github-icon'
import { LogoMark } from './LogoMark'

export function FooterSections() {
  return (
    <>
      <footer
        className="grid grid-cols-1 border-b border-zinc-300 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-3"
      >
        <div className="border-b border-zinc-300 px-4 py-8 dark:border-zinc-800 sm:border-r sm:px-6 lg:border-b-0">
          <h2 className="font-mono text-xs font-semibold uppercase text-zinc-500">
            About
          </h2>
          <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            PrivateTranscribe.app is a local-first transcription tool for people
            who do not want audio sent to a hosted transcription API.
          </p>
        </div>
        <div className="border-b border-zinc-300 px-4 py-8 dark:border-zinc-800 sm:border-b-0 sm:border-r sm:px-6">
          <h2 className="font-mono text-xs font-semibold uppercase text-zinc-500">
            Sitemap
          </h2>
          <nav className="mt-4 grid gap-2 text-sm">
            {sitemapItems.map(([label, href]) => (
              <a
                className="cursor-pointer text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-100"
                href={href}
                key={href}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <div className="px-4 py-8 sm:px-6">
          <h2 className="font-mono text-xs font-semibold uppercase text-zinc-500">
            Privacy
          </h2>
          <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
            No upload for core transcription. AGPL-3.0-only.
          </p>
        </div>
      </footer>

      <footer className="flex flex-col gap-2 px-4 py-5 font-mono text-xs text-zinc-500 dark:text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span className="flex items-center gap-2">
          <LogoMark className="block size-4 bg-zinc-500" />
          PrivateTranscribe.app
        </span>
        <span className="flex items-center gap-4">
          <a
            className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            href="https://github.com/mikejarxyz/privatetranscribe"
            rel="noreferrer"
            target="_blank"
          >
            <GithubIcon className="size-4" />
            Source
          </a>
          <span>AGPL-3.0-only</span>
        </span>
      </footer>
    </>
  )
}

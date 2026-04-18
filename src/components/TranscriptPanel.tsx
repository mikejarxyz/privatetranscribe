import { Check, Clipboard, Download } from 'lucide-react'
import type { TranscriptionController } from '../hooks/useTranscriptionController'

type TranscriptPanelProps = Pick<
  TranscriptionController,
  | 'handleCopyTranscript'
  | 'handleDownloadTranscript'
  | 'hasCopiedTranscript'
  | 'hasTranscript'
  | 'transcript'
>

export function TranscriptPanel({
  handleCopyTranscript,
  handleDownloadTranscript,
  hasCopiedTranscript,
  hasTranscript,
  transcript,
}: TranscriptPanelProps) {
  return (
    <div className="flex min-h-0 flex-col px-4 py-8 sm:px-6 lg:py-16">
      <section className="flex min-h-0 flex-1 flex-col border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-300 px-4 py-3 dark:border-zinc-800">
          <h2 className="font-mono text-sm font-semibold uppercase">
            Transcript
          </h2>
          <div className="flex gap-2">
            <button
              aria-label={
                hasCopiedTranscript ? 'Transcript copied' : 'Copy transcript'
              }
              className="grid size-8 cursor-pointer place-items-center border border-zinc-300 text-zinc-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-800 dark:hover:bg-zinc-950"
              disabled={!hasTranscript}
              onClick={handleCopyTranscript}
              title={hasCopiedTranscript ? 'Copied' : 'Copy transcript'}
              type="button"
            >
              {hasCopiedTranscript ? (
                <Check
                  aria-hidden="true"
                  className="size-4 text-lime-600 dark:text-lime-400"
                  strokeWidth={1.9}
                />
              ) : (
                <Clipboard
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.75}
                />
              )}
            </button>
            <button
              aria-label="Download transcript as text file"
              className="grid size-8 cursor-pointer place-items-center border border-zinc-300 text-zinc-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-800 dark:hover:bg-zinc-950"
              disabled={!hasTranscript}
              onClick={handleDownloadTranscript}
              title="Download transcript"
              type="button"
            >
              <Download
                aria-hidden="true"
                className="size-4"
                strokeWidth={1.75}
              />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm leading-6 text-zinc-800 dark:text-zinc-200">
          {hasTranscript ? (
            <p className="whitespace-pre-wrap">{transcript}</p>
          ) : (
            <p className="text-zinc-500 dark:text-zinc-500">
              Transcript output will appear here after local transcription runs.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

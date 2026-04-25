import { Check, Clipboard, Download } from 'lucide-react'
import type { TranscriptionController } from '../hooks/useTranscriptionController'

type TranscriptPanelProps = Pick<
  TranscriptionController,
  | 'completedJobs'
  | 'handleCopyTranscript'
  | 'handleDownloadAllTranscripts'
  | 'handleDownloadTranscript'
  | 'handleSelectJob'
  | 'hasCopiedTranscript'
  | 'hasTranscript'
  | 'selectedJobId'
  | 'transcript'
>

export function TranscriptPanel({
  handleCopyTranscript,
  handleDownloadAllTranscripts,
  handleDownloadTranscript,
  handleSelectJob,
  completedJobs,
  hasCopiedTranscript,
  hasTranscript,
  selectedJobId,
  transcript,
}: TranscriptPanelProps) {
  return (
    <div className="flex min-h-0 flex-col px-4 py-8 sm:px-6 lg:relative lg:py-16">
      <section className="flex min-h-0 flex-1 flex-col border border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-900 lg:absolute lg:inset-x-6 lg:inset-y-16">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-300 px-4 py-3 dark:border-zinc-800">
          <h2 className="font-mono text-sm font-semibold uppercase">
            Transcript
          </h2>
          <button
            aria-label="Download all transcripts as zip"
            className="cursor-pointer border border-zinc-300 px-2 text-[11px] uppercase text-zinc-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-800 dark:hover:bg-zinc-950"
            disabled={completedJobs.length === 0}
            onClick={handleDownloadAllTranscripts}
            title="Download all transcripts"
            type="button"
          >
            Download all
          </button>
        </div>
        {completedJobs.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-b border-zinc-300 px-4 py-3 dark:border-zinc-800">
            {completedJobs.map((job) => (
              <button
                className={[
                  'max-w-full truncate border px-2 py-1 text-xs',
                  selectedJobId === job.id
                    ? 'border-lime-600 bg-lime-50 dark:border-lime-500/70 dark:bg-lime-500/10'
                    : 'border-zinc-300 hover:bg-stone-50 dark:border-zinc-800 dark:hover:bg-zinc-950',
                ].join(' ')}
                key={job.id}
                onClick={() => handleSelectJob(job.id)}
                type="button"
              >
                {job.file.name}
              </button>
            ))}
          </div>
        ) : null}
        <div className="relative min-h-0 flex-1 overflow-y-auto p-4 text-sm leading-6 text-zinc-800 dark:text-zinc-200">
          {hasTranscript ? (
            <>
              <div className="sticky top-0 z-10 mb-3 flex justify-end gap-2 bg-white pb-3 dark:bg-zinc-900">
                <button
                  aria-label={
                    hasCopiedTranscript ? 'Transcript copied' : 'Copy transcript'
                  }
                  className="grid size-8 cursor-pointer place-items-center border border-zinc-300 bg-white text-zinc-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-950"
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
                  className="grid size-8 cursor-pointer place-items-center border border-zinc-300 bg-white text-zinc-500 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-950"
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
              <p className="whitespace-pre-wrap">{transcript}</p>
            </>
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

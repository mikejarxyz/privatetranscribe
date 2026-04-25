import { useState } from 'react'
import { X } from 'lucide-react'
import type { TranscriptionController } from '../hooks/useTranscriptionController'
import { acceptedAudioInput } from '../transcription/audio'
import { formatBytes } from '../utils/format'
import { ModelSelector } from './ModelSelector'

type TranscriptionToolProps = Pick<
  TranscriptionController,
  | 'cachedModelIds'
  | 'handleClearJobs'
  | 'fileError'
  | 'fileInputRef'
  | 'handleDeleteModel'
  | 'handleDownloadModel'
  | 'handleFiles'
  | 'handleModelChange'
  | 'handleRemoveJob'
  | 'handleSelectJob'
  | 'handleTranscribe'
  | 'isModelDownloading'
  | 'isModelWorking'
  | 'isSelectedModelCached'
  | 'isTranscribing'
  | 'jobs'
  | 'loadedModelId'
  | 'modelDownloadProgress'
  | 'selectedJobId'
  | 'selectedModel'
  | 'selectedModelId'
  | 'transcriptionProgress'
>

export function TranscriptionTool(props: TranscriptionToolProps) {
  const {
    handleClearJobs,
    fileError,
    fileInputRef,
    handleFiles,
    handleRemoveJob,
    handleSelectJob,
    handleTranscribe,
    isModelDownloading,
    isTranscribing,
    jobs,
    selectedJobId,
  } = props
  const [isDragging, setIsDragging] = useState(false)

  return (
    <div className="flex flex-col justify-center border-b border-zinc-300 px-4 py-8 dark:border-zinc-800 sm:px-6 lg:border-b-0 lg:border-r lg:py-16">
      <section
        aria-label="Transcription tool"
        className="border border-zinc-400 bg-white shadow-[6px_6px_0_0_rgba(63,63,70,0.18)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[6px_6px_0_0_rgba(132,204,22,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-zinc-300 px-4 py-3 dark:border-zinc-800">
          <h2 className="font-mono text-sm font-semibold">Transcribe</h2>
          <div className="flex gap-2">
            <span className="border border-lime-700 bg-lime-100 px-2 py-1 font-mono text-[11px] uppercase text-lime-900 dark:border-lime-500/50 dark:bg-lime-500/10 dark:text-lime-300">
              Private
            </span>
            <span className="border border-lime-700 bg-lime-100 px-2 py-1 font-mono text-[11px] uppercase text-lime-900 dark:border-lime-500/50 dark:bg-lime-500/10 dark:text-lime-300">
              Local
            </span>
          </div>
        </div>

        <div className="p-4">
          <input
            accept={acceptedAudioInput}
            className="sr-only"
            onChange={(event) => handleFiles(event.currentTarget.files)}
            ref={fileInputRef}
            type="file"
            multiple
          />

          <div
            className={[
              'group relative flex min-h-64 w-full cursor-pointer flex-col items-center justify-center border border-dashed px-4 py-8 text-center focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-900',
              isDragging
                ? 'border-lime-700 bg-lime-50 dark:border-lime-500 dark:bg-lime-500/10'
                : 'border-zinc-500 bg-stone-50 hover:bg-lime-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900',
            ].join(' ')}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={(event) => {
              event.preventDefault()
              setIsDragging(false)
            }}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault()
              setIsDragging(false)
              handleFiles(event.dataTransfer.files)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                fileInputRef.current?.click()
              }
            }}
            role="button"
            tabIndex={0}
          >
            {jobs.length > 0 ? (
              <div className="w-full max-w-md space-y-2 text-left">
                {jobs.map((job) => (
                  <button
                    className={[
                      'group/file flex w-full items-center justify-between border px-3 py-2 text-left',
                      job.id === selectedJobId
                        ? 'border-lime-600 bg-lime-50 dark:border-lime-500/70 dark:bg-lime-500/10'
                        : 'border-zinc-300 bg-white dark:border-zinc-800 dark:bg-zinc-950',
                    ].join(' ')}
                    key={job.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleSelectJob(job.id)
                    }}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-xs font-semibold">
                        {job.file.name}
                      </span>
                      <span className="block text-[11px] uppercase text-zinc-500 dark:text-zinc-400">
                        {job.status}
                      </span>
                    </span>
                    <span className="ml-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="inline-block transition-all duration-200 group-hover/file:translate-x-[-6px] group-focus-within/file:translate-x-[-6px]">
                        {formatBytes(job.file.size)}
                      </span>
                      <span className="pointer-events-none ml-2 inline-flex w-0 translate-x-2 items-center overflow-hidden opacity-0 transition-all duration-200 group-hover/file:w-7 group-hover/file:translate-x-0 group-hover/file:opacity-100 group-focus-within/file:w-7 group-focus-within/file:translate-x-0 group-focus-within/file:opacity-100">
                        <button
                          aria-label={`Remove ${job.file.name} from queue`}
                          className="pointer-events-auto grid size-7 cursor-pointer place-items-center border border-zinc-300 bg-stone-50 text-zinc-500 hover:bg-white hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-lime-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
                          onClick={(event) => {
                            event.stopPropagation()
                            handleRemoveJob(job.id)
                          }}
                          title={`Remove ${job.file.name}`}
                          type="button"
                        >
                          <X aria-hidden="true" className="size-4" strokeWidth={1.9} />
                        </button>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <span className="font-mono text-sm font-semibold">
                Drop audio/video here
              </span>
            )}
            <span className="mt-2 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {jobs.length > 0
                ? `${jobs.length} file${jobs.length === 1 ? '' : 's'} queued`
                : 'Your files stay on your device.'}
            </span>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                className="cursor-pointer border border-zinc-500 bg-zinc-950 px-4 py-3 font-mono text-xs uppercase text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45 dark:border-lime-500/50 dark:bg-lime-500/10 dark:text-lime-300 dark:hover:bg-lime-500/15"
                disabled={isTranscribing || isModelDownloading}
                onClick={(event) => {
                  event.stopPropagation()
                  if (jobs.length > 0) {
                    void handleTranscribe()
                    return
                  }

                  fileInputRef.current?.click()
                }}
                type="button"
              >
                {isModelDownloading
                  ? 'Loading model'
                  : isTranscribing
                    ? 'Transcribing all'
                    : jobs.length > 0
                      ? 'Transcribe all'
                      : 'Choose files'}
              </button>
              <button
                className="cursor-pointer border border-zinc-500 bg-white px-4 py-3 font-mono text-xs uppercase text-zinc-800 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                disabled={isTranscribing || jobs.length === 0}
                onClick={(event) => {
                  event.stopPropagation()
                  handleClearJobs()
                }}
                type="button"
              >
                Clear all
              </button>
            </div>
            {fileError ? (
              <p
                className="absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] text-left text-xs leading-5 text-red-700 dark:text-red-300"
                role="alert"
              >
                {fileError}
              </p>
            ) : null}
          </div>

          <ModelSelector {...props} />
        </div>
      </section>
    </div>
  )
}

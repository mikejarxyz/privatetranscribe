import { useState } from 'react'
import { X } from 'lucide-react'
import type { TranscriptionController } from '../hooks/useTranscriptionController'
import { acceptedAudioInput } from '../transcription/audio'
import { formatBytes, getFileType } from '../utils/format'
import { ModelSelector } from './ModelSelector'

type TranscriptionToolProps = Pick<
  TranscriptionController,
  | 'cachedModelIds'
  | 'clearSelectedFile'
  | 'fileInputRef'
  | 'handleDeleteModel'
  | 'handleDownloadModel'
  | 'handleFiles'
  | 'handleModelChange'
  | 'handleTranscribe'
  | 'isModelDownloading'
  | 'isModelWorking'
  | 'isSelectedModelCached'
  | 'isTranscribing'
  | 'loadedModelId'
  | 'modelDownloadProgress'
  | 'selectedFile'
  | 'selectedModel'
  | 'selectedModelId'
>

export function TranscriptionTool(props: TranscriptionToolProps) {
  const {
    clearSelectedFile,
    fileInputRef,
    handleFiles,
    handleTranscribe,
    isModelDownloading,
    isTranscribing,
    selectedFile,
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
            {selectedFile ? (
              <>
                <span className="max-w-full truncate font-mono text-sm font-semibold">
                  {selectedFile.name}
                </span>
                <button
                  aria-label="Clear selected audio file"
                  className="absolute right-3 top-3 grid size-7 cursor-pointer place-items-center border border-zinc-300 bg-stone-50 text-zinc-500 opacity-100 hover:bg-white hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-lime-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation()
                    clearSelectedFile()
                  }}
                  title="Clear file"
                  type="button"
                >
                  <X aria-hidden="true" className="size-4" strokeWidth={1.9} />
                </button>
              </>
            ) : (
              <span className="font-mono text-sm font-semibold">
                Drop audio/video here
              </span>
            )}
            <span className="mt-2 max-w-sm text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {selectedFile
                ? `${getFileType(selectedFile)} · ${formatBytes(selectedFile.size)}`
                : 'Your files stay on your device.'}
            </span>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                className="cursor-pointer border border-zinc-500 bg-zinc-950 px-4 py-3 font-mono text-xs uppercase text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-45 dark:border-lime-500/50 dark:bg-lime-500/10 dark:text-lime-300 dark:hover:bg-lime-500/15"
                disabled={isTranscribing || isModelDownloading}
                onClick={(event) => {
                  event.stopPropagation()
                  if (selectedFile) {
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
                    ? 'Transcribing'
                    : selectedFile
                      ? 'Transcribe'
                      : 'Choose file'}
              </button>
            </div>
          </div>

          <ModelSelector {...props} />
        </div>
      </section>
    </div>
  )
}

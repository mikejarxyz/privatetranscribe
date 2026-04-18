import { useState } from 'react'
import { ChevronDown, Download, Info, Trash2 } from 'lucide-react'
import { transcriptionModels } from '../transcription/models'
import type { TranscriptionController } from '../hooks/useTranscriptionController'
import { TooltipButton } from './TooltipButton'

type ModelSelectorProps = Pick<
  TranscriptionController,
  | 'cachedModelIds'
  | 'handleDeleteModel'
  | 'handleDownloadModel'
  | 'handleModelChange'
  | 'isModelDownloading'
  | 'isSelectedModelCached'
  | 'isTranscribing'
  | 'loadedModelId'
  | 'modelDownloadProgress'
  | 'selectedModel'
  | 'selectedModelId'
>

const modelOptions = transcriptionModels

export function ModelSelector({
  cachedModelIds,
  handleDeleteModel,
  handleDownloadModel,
  handleModelChange,
  isModelDownloading,
  isSelectedModelCached,
  isTranscribing,
  loadedModelId,
  modelDownloadProgress,
  selectedModel,
  selectedModelId,
}: ModelSelectorProps) {
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  const modelStatusLabel = isModelDownloading
    ? 'Model downloading'
    : isTranscribing && isSelectedModelCached
      ? 'Transcribing...'
      : isSelectedModelCached
        ? 'Model ready'
        : 'Model not downloaded'

  function handleChange(modelId: string) {
    handleModelChange(modelId)
    setIsModelMenuOpen(false)
  }

  return (
    <div className="mt-4 border border-zinc-300 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="relative flex items-center justify-between gap-3 border-b border-zinc-300 px-3 py-2 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-xs uppercase text-zinc-500 dark:text-zinc-500">
            Local model
          </span>
          <TooltipButton
            ariaLabel="Model download information"
            buttonClassName="grid h-5 w-5 cursor-pointer place-items-center rounded-full text-zinc-500 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-lime-500 dark:hover:text-zinc-100"
            tooltip={
              <>
                First use downloads the selected model. Changing models replaces
                the local model cache. Your audio is not uploaded.
              </>
            }
            tooltipClassName="absolute left-[-4.75rem] top-[calc(100%+6px)] z-30 w-[calc(100vw-2rem)] max-w-64 border border-zinc-400 bg-white p-3 text-xs leading-5 text-zinc-700 shadow-[4px_4px_0_0_rgba(63,63,70,0.18)] sm:left-0 sm:w-64 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]"
          >
            <Info aria-hidden="true" className="h-3.5 w-3.5" />
          </TooltipButton>
        </div>
        <TooltipButton
          ariaLabel={modelStatusLabel}
          buttonClassName="grid size-5 cursor-pointer place-items-center rounded-full focus:outline-none focus:ring-2 focus:ring-lime-500/35"
          tooltip={modelStatusLabel}
          tooltipClassName="absolute right-0 top-[calc(100%+6px)] z-30 whitespace-nowrap border border-zinc-400 bg-white px-3 py-2 text-xs leading-5 text-zinc-700 shadow-[4px_4px_0_0_rgba(63,63,70,0.18)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]"
        >
          <span
            aria-hidden="true"
            className={[
              'size-2 rounded-full border',
              isModelDownloading
                ? 'animate-status-pulse border-yellow-700 bg-yellow-400 shadow-[0_0_10px_2px_rgba(250,204,21,0.45)] dark:border-yellow-400'
                : isTranscribing && isSelectedModelCached
                  ? 'animate-status-pulse border-lime-700 bg-lime-500 shadow-[0_0_10px_2px_rgba(132,204,22,0.5)] dark:border-lime-400'
                  : isSelectedModelCached
                    ? 'border-lime-700 bg-lime-500 shadow-[0_0_10px_2px_rgba(132,204,22,0.45)] dark:border-lime-400'
                    : 'border-yellow-700 bg-yellow-400 shadow-[0_0_10px_2px_rgba(250,204,21,0.38)] dark:border-yellow-400',
            ].join(' ')}
          />
        </TooltipButton>
        {isModelDownloading ? (
          <span
            aria-hidden="true"
            className="absolute bottom-[-1px] left-0 h-0.5 bg-lime-500 transition-[width]"
            style={{ width: `${modelDownloadProgress}%` }}
          />
        ) : null}
      </div>
      <div className="p-3">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
          <div className="relative min-w-0">
            <button
              aria-expanded={isModelMenuOpen}
              aria-haspopup="listbox"
              className="grid h-10 w-full min-w-0 cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center border border-zinc-400 bg-white px-3 text-left text-sm text-zinc-900 hover:bg-lime-50 focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              disabled={isModelDownloading}
              onBlur={(event) => {
                if (
                  !event.currentTarget.parentElement?.contains(
                    event.relatedTarget,
                  )
                ) {
                  setIsModelMenuOpen(false)
                }
              }}
              onClick={() => setIsModelMenuOpen((isOpen) => !isOpen)}
              type="button"
            >
              <span className="min-w-0 truncate">{selectedModel.name}</span>
              <ChevronDown
                aria-hidden="true"
                className={[
                  'ml-3 h-4 w-4 text-zinc-500 transition-transform',
                  isModelMenuOpen ? 'rotate-180' : '',
                ].join(' ')}
                strokeWidth={1.75}
              />
            </button>

            {isModelMenuOpen ? (
              <div
                className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 border border-zinc-400 bg-white shadow-[4px_4px_0_0_rgba(63,63,70,0.18)] dark:border-zinc-700 dark:bg-zinc-900 dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]"
                role="listbox"
              >
                {modelOptions.map((model) => {
                  const isSelected = model.id === selectedModelId
                  const isCached =
                    model.id === loadedModelId ||
                    cachedModelIds.includes(model.id)

                  return (
                    <button
                      aria-selected={isSelected}
                      className={[
                        'w-full cursor-pointer border-b border-zinc-200 px-3 py-3 text-left last:border-b-0 dark:border-zinc-800',
                        isSelected
                          ? 'bg-lime-50 dark:bg-lime-500/10'
                          : 'bg-white hover:bg-stone-50 dark:bg-zinc-900 dark:hover:bg-zinc-800',
                      ].join(' ')}
                      key={model.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleChange(model.id)}
                      role="option"
                      type="button"
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">
                          {model.name}
                        </span>
                        <span className="flex items-center gap-2">
                          {isCached ? (
                            <span
                              aria-label="Downloaded in this browser"
                              className="size-1.5 rounded-full border border-lime-700 bg-lime-500 shadow-[0_0_8px_1px_rgba(132,204,22,0.42)] dark:border-lime-400"
                              role="status"
                              title="Downloaded"
                            />
                          ) : null}
                          <span className="font-mono text-xs text-zinc-500">
                            {model.estimate}
                          </span>
                        </span>
                      </span>
                      <span className="mt-1 block font-mono text-[11px] uppercase text-zinc-500">
                        {model.model}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                        {model.note}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 justify-end">
            <button
              aria-label={
                isSelectedModelCached
                  ? 'Delete local model'
                  : 'Download local model'
              }
              className="grid size-10 cursor-pointer place-items-center border border-zinc-400 bg-white text-zinc-800 hover:bg-lime-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              disabled={isModelDownloading}
              onClick={
                isSelectedModelCached ? handleDeleteModel : handleDownloadModel
              }
              title={
                isSelectedModelCached
                  ? 'Delete local model'
                  : 'Download local model'
              }
              type="button"
            >
              {isSelectedModelCached ? (
                <Trash2
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.75}
                />
              ) : (
                <Download
                  aria-hidden="true"
                  className="size-4"
                  strokeWidth={1.75}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

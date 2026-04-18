import { useEffect, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  Clipboard,
  Download,
  Info,
  Moon,
  Minus,
  Plus,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import {
  acceptedAudioInput,
  getAcceptedAudioLabel,
  isAcceptedAudioFile,
} from './transcription/audio'
import { createTranscriptionWorker } from './transcription/client'
import { decodeAudioFile } from './transcription/decodeAudio'
import {
  transcriptionModels,
  type TranscriptionModelId,
} from './transcription/models'
import type {
  TranscriptionWorkerRequest,
  TranscriptionWorkerResponse,
} from './transcription/messages'

type ThemeMode = 'light' | 'dark'
type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'

const modelOptions = transcriptionModels
const selectedModelStorageKey = 'private-transcribe-selected-model'
const demoTranscript = `Speaker 1: This is a local transcription demo.

Speaker 2: Audio stays in the browser. The model runs on this device, and the finished transcript can be copied or downloaded as text.`

const featureItems = [
  {
    title: 'Local first',
    body: 'The core transcription flow runs in the browser instead of uploading audio to a remote API.',
  },
  {
    title: 'No account',
    body: 'Use the tool without signups, dashboards, projects, seats, or billing screens.',
  },
  {
    title: 'Reusable model cache',
    body: 'After the first download, supported browsers can reuse the selected model locally.',
  },
  {
    title: 'Exportable text',
    body: 'Copy the result or download a plain text transcript when the job is done.',
  },
] as const

const resultSteps = [
  'Choose audio',
  'Load local model',
  'Transcribe in browser',
  'Copy or download text',
] as const

const faqItems = [
  {
    question: 'Is it really private?',
    answer:
      'Yes! Your files NEVER leave your device! The speech model is downloaded to the browser, then your audio is processed on your right on your machine!',
  },
  {
    question: 'Why is the first run slower?',
    answer:
      'The browser has to download the selected speech model before it can transcribe. Smaller models start faster; larger models can be more accurate. Usually the smallest model is good enough, but if you are on desktop or decent laptop, you can choose the larger model for slower, better accuracy.',
  },
  {
    question: 'Can I remove the downloaded model?',
    answer:
      'Yes. Use the trash button beside the model selector to remove the selected model from this site\'s browser cache.',
  },
] as const

const sitemapItems = [
  ['Tool', '#tool'],
  ['Features', '#features'],
  ['Privacy', '#privacy'],
  ['FAQs', '#faqs'],
] as const

function createRequestId() {
  return crypto.randomUUID()
}

function postWorkerRequest(
  worker: Worker | null,
  message: TranscriptionWorkerRequest,
) {
  worker?.postMessage(message)
}

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

function getInitialModelId(): TranscriptionModelId {
  if (typeof window === 'undefined') {
    return modelOptions[0].id
  }

  const storedModelId = window.localStorage.getItem(selectedModelStorageKey)
  const storedModel = modelOptions.find((model) => model.id === storedModelId)

  return storedModel?.id ?? modelOptions[0].id
}

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )
  const value = bytes / 1024 ** unitIndex

  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function getFileType(file: File) {
  return file.type || 'Audio file'
}

function DiagonalDivider() {
  return (
    <div
      aria-hidden="true"
      className="h-20 border-b border-zinc-300 bg-zinc-950 dark:border-zinc-800"
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, transparent 0 14px, rgba(161,161,170,0.16) 14px 15px)',
      }}
    />
  )
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const copiedTimeoutRef = useRef<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [hasCopiedTranscript, setHasCopiedTranscript] = useState(false)
  const [selectedModelId, setSelectedModelId] = useState<TranscriptionModelId>(
    getInitialModelId,
  )
  const [cachedModelIds, setCachedModelIds] = useState<TranscriptionModelId[]>([])
  const [loadedModelId, setLoadedModelId] = useState<TranscriptionModelId | null>(
    null,
  )
  const [modelStatus, setModelStatus] = useState<ModelStatus>('idle')
  const [isModelDownloading, setIsModelDownloading] = useState(false)
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  const [isModelInfoOpen, setIsModelInfoOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode)
  const [modelDownloadProgress, setModelDownloadProgress] = useState(0)
  const [, setStatus] = useState('Waiting for an audio file.')
  const [isTranscribing, setIsTranscribing] = useState(false)

  const hasTranscript = transcript.trim().length > 0
  const selectedModel =
    modelOptions.find((model) => model.id === selectedModelId) ?? modelOptions[0]
  const isSelectedModelReady =
    modelStatus === 'ready' && loadedModelId === selectedModelId
  const isSelectedModelCached =
    isSelectedModelReady || cachedModelIds.includes(selectedModelId)
  const isModelWorking = isModelDownloading || isTranscribing

  useEffect(() => {
    const worker = createTranscriptionWorker()

    workerRef.current = worker
    worker.addEventListener(
      'message',
      (event: MessageEvent<TranscriptionWorkerResponse>) => {
        const message = event.data

        switch (message.type) {
          case 'worker-ready':
            postWorkerRequest(worker, {
              id: createRequestId(),
              type: 'inspect-cache',
              preferredModelId: getInitialModelId(),
            })
            return
          case 'cache-inspected':
            setCachedModelIds(message.cachedModelIds)
            if (message.selectedModelId) {
              setSelectedModelId(message.selectedModelId)
              window.localStorage.setItem(
                selectedModelStorageKey,
                message.selectedModelId,
              )
              setStatus('Local model files found in this browser.')
            }
            return
          case 'model-loading':
            setModelStatus('loading')
            setIsModelDownloading(true)
            setModelDownloadProgress(0)
            setStatus('Preparing local transcription model.')
            return
          case 'model-download-progress':
            setModelDownloadProgress((currentProgress) =>
              Math.max(currentProgress, message.progress),
            )
            return
          case 'model-ready':
            setModelStatus('ready')
            setLoadedModelId(message.modelId)
            setCachedModelIds([message.modelId])
            setIsModelDownloading(false)
            setModelDownloadProgress(100)
            window.localStorage.setItem(selectedModelStorageKey, message.modelId)
            setStatus('Local model is ready.')
            return
          case 'model-deleted':
            setModelStatus('idle')
            setLoadedModelId((currentModelId) =>
              currentModelId === message.modelId ? null : currentModelId,
            )
            setCachedModelIds((currentModelIds) =>
              currentModelIds.filter((modelId) => modelId !== message.modelId),
            )
            setIsModelDownloading(false)
            setModelDownloadProgress(0)
            setStatus('Local model removed from this browser.')
            return
          case 'transcription-started':
            setIsTranscribing(true)
            setStatus('Transcribing locally.')
            return
          case 'transcription-complete':
            setIsTranscribing(false)
            setTranscript(message.text)
            setStatus('Transcript complete.')
            return
          case 'worker-error':
            setModelStatus('error')
            setIsModelDownloading(false)
            setIsTranscribing(false)
            setStatus(message.message)
            return
        }
      },
    )

    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current)
      }

      worker.terminate()
      workerRef.current = null
    }
  }, [])

  useEffect(() => {
    const shouldUseDark = themeMode === 'dark'

    document.documentElement.classList.toggle('dark', shouldUseDark)
    document.documentElement.style.colorScheme = shouldUseDark ? 'dark' : 'light'
    window.localStorage.setItem('private-transcribe-theme', themeMode)
  }, [themeMode])

  function handleFiles(files: FileList | null) {
    const file = files?.[0]

    if (!file) {
      return
    }

    if (!isAcceptedAudioFile(file)) {
      setSelectedFile(null)
      setTranscript('')
      setStatus(`Unsupported file type. Use ${getAcceptedAudioLabel()}.`)
      return
    }

    setSelectedFile(file)
    setTranscript('')
    setStatus(
      isSelectedModelReady
        ? 'Audio loaded. Ready to transcribe locally.'
        : 'Audio loaded. The selected model will load before transcription.',
    )
  }

  function clearSelectedFile() {
    setSelectedFile(null)
    setTranscript('')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleModelChange(modelId: string) {
    if (isModelDownloading) {
      setStatus('Wait for the current model download to finish first.')
      setIsModelMenuOpen(false)
      return
    }

    const nextModel = modelOptions.find((model) => model.id === modelId)

    if (!nextModel) {
      return
    }

    window.localStorage.setItem(selectedModelStorageKey, nextModel.id)
    setSelectedModelId(nextModel.id)
    setModelStatus(loadedModelId === nextModel.id ? 'ready' : 'idle')
    setIsModelDownloading(false)
    setModelDownloadProgress(0)
    setIsModelMenuOpen(false)
    setIsModelInfoOpen(false)
  }

  function handleDownloadModel() {
    const request: TranscriptionWorkerRequest = {
      id: createRequestId(),
      type: 'prepare-model',
      modelId: selectedModelId,
    }

    setIsModelDownloading(true)
    setModelStatus('loading')
    setModelDownloadProgress(0)
    setStatus('Preparing local transcription model.')
    postWorkerRequest(workerRef.current, request)
  }

  function handleDeleteModel() {
    const request: TranscriptionWorkerRequest = {
      id: createRequestId(),
      type: 'delete-model',
      modelId: selectedModelId,
    }

    setModelStatus('idle')
    setIsModelDownloading(false)
    setModelDownloadProgress(0)
    postWorkerRequest(workerRef.current, request)
  }

  async function handleTranscribe() {
    if (isTranscribing) {
      return
    }

    if (!selectedFile) {
      setStatus('Choose an audio file to transcribe.')
      fileInputRef.current?.click()
      return
    }

    if (isModelDownloading) {
      setStatus('Wait for the local model to finish loading first.')
      return
    }

    try {
      setTranscript('')
      setIsTranscribing(true)
      setStatus('Preparing audio locally.')

      const audio = await decodeAudioFile(selectedFile)
      const request: TranscriptionWorkerRequest = {
        id: createRequestId(),
        type: 'transcribe',
        modelId: selectedModelId,
        audio,
      }

      setStatus('Sending audio to local transcription worker.')
      workerRef.current?.postMessage(request, [audio.buffer])
    } catch (error) {
      setIsTranscribing(false)
      setStatus(
        error instanceof Error
          ? error.message
          : 'Unable to prepare audio for transcription.',
      )
    }
  }

  function handleCopyTranscript() {
    if (!hasTranscript) {
      return
    }

    void navigator.clipboard.writeText(transcript)
    setHasCopiedTranscript(true)

    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current)
    }

    copiedTimeoutRef.current = window.setTimeout(() => {
      setHasCopiedTranscript(false)
      copiedTimeoutRef.current = null
    }, 1500)
  }

  function handleDownloadTranscript() {
    if (!hasTranscript) {
      return
    }

    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'transcript'}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function handleDemoTranscript() {
    setTranscript(demoTranscript)
    setSelectedFile(null)
    setStatus('Demo transcript loaded.')

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 text-zinc-950 selection:bg-lime-300 selection:text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100 dark:selection:bg-lime-400">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col border-x border-zinc-300 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-925">
        <header className="flex items-center justify-between border-b border-zinc-300 px-4 py-3 text-sm dark:border-zinc-800 sm:px-6">
          <a
            className="flex cursor-pointer items-center gap-3 font-mono font-semibold tracking-normal"
            href="/"
          >
            <span
              aria-hidden="true"
              className="block size-6 bg-lime-600 dark:bg-lime-400"
              style={{
                mask: 'url(/logo.svg) center / contain no-repeat',
                WebkitMask: 'url(/logo.svg) center / contain no-repeat',
              }}
            />
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
              aria-label={
                themeMode === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
              className="grid size-8 cursor-pointer place-items-center border border-zinc-300 bg-stone-50 text-zinc-600 transition hover:bg-white hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-1 focus:ring-offset-stone-50 dark:border-zinc-800 dark:bg-zinc-925 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100 dark:focus:ring-offset-zinc-925"
              onClick={() =>
                setThemeMode((currentMode) =>
                  currentMode === 'dark' ? 'light' : 'dark',
                )
              }
              title={
                themeMode === 'dark'
                  ? 'Switch to light theme'
                  : 'Switch to dark theme'
              }
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

        <section
          className="grid grid-cols-1 items-stretch border-b border-zinc-300 dark:border-zinc-800 lg:grid-cols-[minmax(360px,1fr)_minmax(0,1fr)]"
          id="tool"
        >
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
                        <X
                          aria-hidden="true"
                          className="size-4"
                          strokeWidth={1.9}
                        />
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
                      : 'Your files stay in this browser.'}
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
                            ? 'Transcribe audio'
                            : 'Choose file'}
                    </button>
                  </div>
                </div>

                <div className="mt-4 border border-zinc-300 bg-stone-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <div className="relative flex items-center justify-between gap-3 border-b border-zinc-300 px-3 py-2 dark:border-zinc-800">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-xs uppercase text-zinc-500 dark:text-zinc-500">
                        Local model
                      </span>
                      <div className="relative">
                        <button
                          aria-expanded={isModelInfoOpen}
                          aria-label="Model download information"
                          className="grid h-5 w-5 cursor-pointer place-items-center rounded-full text-zinc-500 hover:text-zinc-950 focus:outline-none focus:ring-2 focus:ring-lime-500 dark:hover:text-zinc-100"
                          onBlur={(event) => {
                            if (
                              !event.currentTarget.parentElement?.contains(
                                event.relatedTarget,
                              )
                            ) {
                              setIsModelInfoOpen(false)
                            }
                          }}
                          onClick={() => setIsModelInfoOpen((isOpen) => !isOpen)}
                          onMouseEnter={() => setIsModelInfoOpen(true)}
                          onMouseLeave={() => setIsModelInfoOpen(false)}
                          type="button"
                        >
                          <Info aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                        {isModelInfoOpen ? (
                          <div className="absolute left-0 top-[calc(100%+6px)] z-30 w-64 border border-zinc-400 bg-white p-3 text-xs leading-5 text-zinc-700 shadow-[4px_4px_0_0_rgba(63,63,70,0.18)] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:shadow-[4px_4px_0_0_rgba(0,0,0,0.35)]">
                            First use downloads the selected model. Changing
                            models replaces the local model cache. Your audio is
                            not uploaded.
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <span
                      aria-label={
                        isModelWorking
                          ? 'Local model is working'
                          : isSelectedModelCached
                            ? 'Local model is downloaded'
                            : 'Local model is not downloaded'
                      }
                      role="status"
                      className={[
                        'size-2 rounded-full border',
                        isModelDownloading
                          ? 'animate-pulse border-yellow-700 bg-yellow-400 shadow-[0_0_10px_2px_rgba(250,204,21,0.45)] dark:border-yellow-400'
                          : isTranscribing && isSelectedModelCached
                            ? 'animate-pulse border-lime-700 bg-lime-500 shadow-[0_0_10px_2px_rgba(132,204,22,0.5)] dark:border-lime-400'
                            : isSelectedModelCached
                              ? 'border-lime-700 bg-lime-500 shadow-[0_0_10px_2px_rgba(132,204,22,0.45)] dark:border-lime-400'
                              : 'border-yellow-700 bg-yellow-400 shadow-[0_0_10px_2px_rgba(250,204,21,0.38)] dark:border-yellow-400',
                      ].join(' ')}
                    />
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
                          <span className="min-w-0 truncate">
                            {selectedModel.name}
                          </span>
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
                                  onClick={() => handleModelChange(model.id)}
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
                            isSelectedModelCached
                              ? handleDeleteModel
                              : handleDownloadModel
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
              </div>
            </section>
          </div>

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
                    title={
                      hasCopiedTranscript ? 'Copied' : 'Copy transcript'
                    }
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
                    Transcript output will appear here after local transcription
                    runs.
                  </p>
                )}
              </div>
            </section>
          </div>
        </section>

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
              onClick={handleDemoTranscript}
              type="button"
            >
              Quick demo
            </button>
          </div>
        </section>

        <DiagonalDivider />

        <section
          className="border-b border-zinc-300 dark:border-zinc-800"
          id="features"
        >
          <div className="grid grid-cols-1 border-b border-zinc-300 dark:border-zinc-800 sm:grid-cols-4">
            {resultSteps.map((step, index) => (
              <div
                className="border-b border-zinc-300 px-4 py-6 dark:border-zinc-800 sm:border-b-0 sm:border-r sm:px-6 sm:last:border-r-0"
                key={step}
              >
                <span className="font-mono text-sm font-semibold text-lime-700 dark:text-lime-400">
                  0{index + 1}
                </span>
                <p className="mt-3 text-sm font-medium">{step}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {featureItems.map((item) => (
              <article
                className="border-b border-zinc-300 px-4 py-8 last:border-b-0 dark:border-zinc-800 sm:px-6 sm:[&:nth-last-child(-n+2)]:border-b-0 sm:[&:nth-child(odd)]:border-r"
                key={item.title}
              >
                <h3 className="font-mono text-sm font-semibold uppercase">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-zinc-700 dark:text-zinc-300">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <DiagonalDivider />

        <section
          className="grid grid-cols-1 border-b border-zinc-300 dark:border-zinc-800 lg:grid-cols-[minmax(360px,1fr)_minmax(0,1fr)]"
          id="privacy"
        >
          <div className="border-b border-zinc-300 px-4 py-8 dark:border-zinc-800 sm:px-6 lg:border-b-0 lg:border-r">
            <h2 className="font-mono text-sm font-semibold uppercase text-lime-700 dark:text-lime-400">
              Privacy
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-zinc-700 dark:text-zinc-300">
              Core transcription runs on your device. The app does not require
              an account, does not store your audio in the cloud, and does not
              upload files for the local transcription flow.
            </p>
          </div>
          <div className="px-4 py-8 sm:px-6" id="how-it-works">
            <h2 className="font-mono text-sm font-semibold uppercase text-lime-700 dark:text-lime-400">
              How it works
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-zinc-700 dark:text-zinc-300">
              The browser downloads a speech model the first time you use it.
              After that, supported browsers can reuse cached files for local
              transcription.
            </p>
          </div>
        </section>

        <DiagonalDivider />

        <section
          className="border-b border-zinc-300 dark:border-zinc-800"
          id="faqs"
        >
          <div className="border-b border-zinc-300 px-4 py-5 dark:border-zinc-800 sm:px-6">
            <h2 className="font-mono text-sm font-semibold uppercase text-lime-700 dark:text-lime-400">
              FAQs
            </h2>
          </div>
          <div className="divide-y divide-zinc-300 dark:divide-zinc-800">
            {faqItems.map((item) => (
              <details className="group px-4 py-5 sm:px-6" key={item.question}>
                <summary className="flex cursor-pointer list-none items-center gap-3 font-mono text-sm font-semibold uppercase marker:hidden">
                  <span className="grid size-5 shrink-0 place-items-center text-lime-700 dark:text-lime-400">
                    <Plus
                      aria-hidden="true"
                      className="size-4 group-open:hidden"
                      strokeWidth={1.8}
                    />
                    <Minus
                      aria-hidden="true"
                      className="hidden size-4 group-open:block"
                      strokeWidth={1.8}
                    />
                  </span>
                  <span>{item.question}</span>
                </summary>
                <p className="mt-3 max-w-3xl leading-7 text-zinc-700 dark:text-zinc-300">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <DiagonalDivider />

        <footer
          className="grid grid-cols-1 border-b border-zinc-300 dark:border-zinc-800 sm:grid-cols-2 lg:grid-cols-4"
          id="contact"
        >
          <div className="border-b border-zinc-300 px-4 py-8 dark:border-zinc-800 sm:border-r sm:px-6 lg:border-b-0">
            <h2 className="font-mono text-xs font-semibold uppercase text-zinc-500">
              About
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              PrivateTranscribe.app is a local-first transcription tool for
              people who do not want audio sent to a hosted transcription API.
            </p>
          </div>
          <div className="border-b border-zinc-300 px-4 py-8 dark:border-zinc-800 sm:px-6 lg:border-b-0 lg:border-r">
            <h2 className="font-mono text-xs font-semibold uppercase text-zinc-500">
              Contact
            </h2>
            <p className="mt-4 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              Contact details can live here before launch.
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
            <span
              aria-hidden="true"
              className="block size-4 bg-zinc-500"
              style={{
                mask: 'url(/logo.svg) center / contain no-repeat',
                WebkitMask: 'url(/logo.svg) center / contain no-repeat',
              }}
            />
            PrivateTranscribe.app
          </span>
          <span>AGPL-3.0-only</span>
        </footer>
      </div>
    </main>
  )
}

export default App

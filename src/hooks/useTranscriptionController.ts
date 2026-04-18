import { useEffect, useRef, useState } from 'react'
import { demoTranscript } from '../content/siteContent'
import {
  getAcceptedAudioLabel,
  isAcceptedAudioFile,
} from '../transcription/audio'
import { createTranscriptionWorker } from '../transcription/client'
import { decodeAudioFile } from '../transcription/decodeAudio'
import {
  transcriptionModels,
  type TranscriptionModelId,
} from '../transcription/models'
import type {
  TranscriptionWorkerRequest,
  TranscriptionWorkerResponse,
} from '../transcription/messages'

type ModelStatus = 'idle' | 'loading' | 'ready' | 'error'

const modelOptions = transcriptionModels
const selectedModelStorageKey = 'private-transcribe-selected-model'

function createRequestId() {
  return crypto.randomUUID()
}

function postWorkerRequest(
  worker: Worker | null,
  message: TranscriptionWorkerRequest,
) {
  worker?.postMessage(message)
}

function getInitialModelId(): TranscriptionModelId {
  if (typeof window === 'undefined') {
    return modelOptions[0].id
  }

  const storedModelId = window.localStorage.getItem(selectedModelStorageKey)
  const storedModel = modelOptions.find((model) => model.id === storedModelId)

  return storedModel?.id ?? modelOptions[0].id
}

export function useTranscriptionController() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workerRef = useRef<Worker | null>(null)
  const copiedTimeoutRef = useRef<number | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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

  return {
    cachedModelIds,
    clearSelectedFile,
    fileInputRef,
    handleCopyTranscript,
    handleDeleteModel,
    handleDemoTranscript,
    handleDownloadModel,
    handleDownloadTranscript,
    handleFiles,
    handleModelChange,
    handleTranscribe,
    hasCopiedTranscript,
    hasTranscript,
    isModelDownloading,
    isModelWorking,
    isSelectedModelCached,
    isTranscribing,
    loadedModelId,
    modelDownloadProgress,
    selectedFile,
    selectedModel,
    selectedModelId,
    transcript,
  }
}

export type TranscriptionController = ReturnType<typeof useTranscriptionController>

import { useCallback, useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import {
  getAcceptedAudioLabel,
  getAudioFileFormatLabel,
  isAcceptedAudioFile,
} from '../transcription/audio'
import { createTranscriptionWorker } from '../transcription/client'
import { decodeAudioFile } from '../transcription/decodeAudio'
import {
  createUniqueTranscriptFileNames,
  createTranscriptionJob,
  getTranscriptFileName,
  MAX_BATCH_FILES,
  type TranscriptionJob,
} from '../transcription/jobs'
import type {
  TranscriptionWorkerRequest,
  TranscriptionWorkerResponse,
} from '../transcription/messages'
import {
  transcriptionModels,
  type TranscriptionModelId,
} from '../transcription/models'

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
  const requestToJobRef = useRef(new Map<string, string>())
  const jobsRef = useRef<TranscriptionJob[]>([])
  const isBatchRunningRef = useRef(false)
  const selectedModelIdRef = useRef<TranscriptionModelId>(getInitialModelId())
  const [jobs, setJobs] = useState<TranscriptionJob[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [fileError, setFileError] = useState('')
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
  const [, setStatus] = useState('Waiting for audio files.')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0)

  const selectedJob =
    jobs.find((candidateJob) => candidateJob.id === selectedJobId) ?? null
  const transcript = selectedJob?.transcript ?? ''
  const completedJobs = jobs.filter((job) => job.status === 'complete')
  const hasTranscript = transcript.trim().length > 0
  const selectedModel =
    modelOptions.find((model) => model.id === selectedModelId) ?? modelOptions[0]
  const isSelectedModelReady =
    modelStatus === 'ready' && loadedModelId === selectedModelId
  const isSelectedModelCached =
    isSelectedModelReady || cachedModelIds.includes(selectedModelId)
  const isModelWorking = isModelDownloading || isTranscribing

  useEffect(() => {
    jobsRef.current = jobs
    isBatchRunningRef.current = isTranscribing
    selectedModelIdRef.current = selectedModelId
  }, [jobs, isTranscribing, selectedModelId])

  const transcribeNextQueuedJob = useCallback(async () => {
    if (!isBatchRunningRef.current) {
      return
    }

    const nextJob = jobsRef.current.find((job) => job.status === 'queued')
    if (!nextJob) {
      isBatchRunningRef.current = false
      setIsTranscribing(false)
      setTranscriptionProgress(0)
      setStatus('Batch transcription complete.')
      return
    }

    try {
      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === nextJob.id
            ? { ...job, status: 'preparing', transcript: '', error: null }
            : job,
        ),
      )
      setSelectedJobId(nextJob.id)
      setTranscriptionProgress(0)
      setStatus(`Preparing ${nextJob.file.name}.`)

      const audio = await decodeAudioFile(nextJob.file)
      const requestId = createRequestId()
      const request: TranscriptionWorkerRequest = {
        id: requestId,
        type: 'transcribe',
        modelId: selectedModelIdRef.current,
        audio,
      }

      requestToJobRef.current.set(requestId, nextJob.id)
      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === nextJob.id ? { ...job, status: 'transcribing' } : job,
        ),
      )
      workerRef.current?.postMessage(request, [audio.buffer])
    } catch (error) {
      setJobs((currentJobs) =>
        currentJobs.map((job) =>
          job.id === nextJob.id
            ? {
                ...job,
                status: 'error',
                error:
                  error instanceof Error
                    ? error.message
                    : 'Unable to prepare audio for transcription.',
              }
            : job,
        ),
      )
      setTranscriptionProgress(0)
      void transcribeNextQueuedJob()
    }
  }, [])

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
            setTranscriptionProgress(1)
            setStatus('Transcribing locally.')
            return
          case 'transcription-progress':
            setTranscriptionProgress((currentProgress) =>
              Math.max(currentProgress, message.progress),
            )
            return
          case 'transcription-complete': {
            const jobId = requestToJobRef.current.get(message.id)
            if (!jobId) {
              return
            }
            requestToJobRef.current.delete(message.id)
            setTranscriptionProgress(100)
            setJobs((currentJobs) =>
              currentJobs.map((job) =>
                job.id === jobId
                  ? {
                      ...job,
                      status: 'complete',
                      transcript: message.text,
                      error: null,
                    }
                  : job,
              ),
            )
            setSelectedJobId((currentSelectedJobId) => currentSelectedJobId ?? jobId)
            void transcribeNextQueuedJob()
            return
          }
          case 'worker-error': {
            setModelStatus('error')
            setIsModelDownloading(false)
            setTranscriptionProgress(0)
            const jobId = requestToJobRef.current.get(message.id)
            if (jobId) {
              requestToJobRef.current.delete(message.id)
              setJobs((currentJobs) =>
                currentJobs.map((job) =>
                  job.id === jobId
                    ? {
                        ...job,
                        status: 'error',
                        error: message.message,
                      }
                    : job,
                ),
              )
            }
            setStatus(message.message)
            void transcribeNextQueuedJob()
            return
          }
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
  }, [transcribeNextQueuedJob])

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) {
      return
    }

    const incomingFiles = Array.from(files)
    const remainingSlots = Math.max(0, MAX_BATCH_FILES - jobsRef.current.length)
    const candidateFiles = incomingFiles.slice(0, remainingSlots)
    const acceptedFiles = candidateFiles.filter((file) => isAcceptedAudioFile(file))
    const rejectedTypeFiles = candidateFiles.filter(
      (file) => !isAcceptedAudioFile(file),
    )
    const overflowCount = Math.max(0, incomingFiles.length - candidateFiles.length)

    if (acceptedFiles.length > 0) {
      const queuedJobs = acceptedFiles.map((file) => createTranscriptionJob(file))
      setJobs((currentJobs) => [...currentJobs, ...queuedJobs])
      setSelectedJobId((currentSelectedJobId) => currentSelectedJobId ?? queuedJobs[0].id)
      setStatus(
        isSelectedModelReady
          ? 'Files queued. Ready to transcribe locally.'
          : 'Files queued. The selected model will load before transcription.',
      )
    }

    const errors: string[] = []
    if (rejectedTypeFiles.length > 0) {
      const rejectedFormats = rejectedTypeFiles
        .map((file) => getAudioFileFormatLabel(file))
        .join(', ')
      errors.push(`${rejectedFormats} is not supported yet.`)
      setStatus(`Unsupported file type. Use ${getAcceptedAudioLabel()}.`)
    }
    if (overflowCount > 0) {
      errors.push(`Only ${MAX_BATCH_FILES} files can be queued at a time.`)
    }
    setFileError(errors.join(' '))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleRemoveJob(jobId: string) {
    if (isTranscribing) {
      return
    }

    setJobs((currentJobs) => currentJobs.filter((job) => job.id !== jobId))
    setSelectedJobId((currentSelectedJobId) => {
      if (currentSelectedJobId !== jobId) {
        return currentSelectedJobId
      }
      const remainingJobs = jobsRef.current.filter((job) => job.id !== jobId)
      return remainingJobs[0]?.id ?? null
    })
  }

  function handleClearJobs() {
    if (isTranscribing) {
      return
    }
    setJobs([])
    setSelectedJobId(null)
    setFileError('')
    setHasCopiedTranscript(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleSelectJob(jobId: string) {
    setSelectedJobId(jobId)
  }

  function handleModelChange(modelId: string) {
    if (isModelWorking) {
      setStatus('Wait for current work to finish first.')
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

    if (jobs.length === 0) {
      setStatus('Choose at least one file to transcribe.')
      fileInputRef.current?.click()
      return
    }

    if (isModelDownloading) {
      setStatus('Wait for the local model to finish loading first.')
      return
    }

    setJobs((currentJobs) =>
      currentJobs.map((job) =>
        job.status === 'error'
          ? { ...job, status: 'queued', transcript: '', error: null }
          : job,
      ),
    )
    setFileError('')
    setTranscriptionProgress(0)
    isBatchRunningRef.current = true
    setIsTranscribing(true)
    await transcribeNextQueuedJob()
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
    if (!hasTranscript || !selectedJob) {
      return
    }

    const blob = new Blob([selectedJob.transcript], {
      type: 'text/plain;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = getTranscriptFileName(selectedJob.file.name)
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadAllTranscripts() {
    if (completedJobs.length === 0) {
      return
    }

    const zip = new JSZip()
    const zipFileNames = createUniqueTranscriptFileNames(
      completedJobs.map((job) => job.file.name),
    )
    completedJobs.forEach((job, index) => {
      zip.file(zipFileNames[index], job.transcript)
    })

    void zip.generateAsync({ type: 'blob' }).then((blob) => {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'transcripts.zip'
      anchor.click()
      URL.revokeObjectURL(url)
    })
  }

  return {
    cachedModelIds,
    completedJobs,
    fileInputRef,
    fileError,
    handleClearJobs,
    handleCopyTranscript,
    handleDeleteModel,
    handleDownloadModel,
    handleDownloadTranscript,
    handleDownloadAllTranscripts,
    handleFiles,
    handleModelChange,
    handleRemoveJob,
    handleSelectJob,
    handleTranscribe,
    hasCopiedTranscript,
    hasTranscript,
    isModelDownloading,
    isModelWorking,
    isSelectedModelCached,
    isTranscribing,
    jobs,
    loadedModelId,
    modelDownloadProgress,
    selectedJob,
    selectedJobId,
    selectedModel,
    selectedModelId,
    transcript,
    transcriptionProgress,
  }
}

export type TranscriptionController = ReturnType<typeof useTranscriptionController>

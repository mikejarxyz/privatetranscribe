import {
  pipeline,
  type AutomaticSpeechRecognitionPipeline,
  type AutomaticSpeechRecognitionOutput,
  type ProgressInfo,
} from '@huggingface/transformers'
import type {
  TranscriptionWorkerRequest,
  TranscriptionWorkerResponse,
} from './messages'
import { transcriptionModels, type TranscriptionModelId } from './models'

let activeModelId: TranscriptionModelId | null = null
let transcriber: AutomaticSpeechRecognitionPipeline | null = null
let loadingModelId: TranscriptionModelId | null = null
let loadingModelPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null

const DOWNLOAD_PROGRESS_CEILING = 92
const TRANSFORMERS_CACHE_NAME = 'transformers-cache'

function postMessageToClient(message: TranscriptionWorkerResponse) {
  self.postMessage(message)
}

function getModel(modelId: TranscriptionModelId) {
  const model = transcriptionModels.find((candidate) => candidate.id === modelId)

  if (!model) {
    throw new Error(`Unknown model: ${modelId}`)
  }

  return model
}

function isModelCacheRequest(url: string, modelId: TranscriptionModelId) {
  const model = getModel(modelId)

  return url.includes(model.repo) || url.includes(encodeURIComponent(model.repo))
}

async function getTransformersCache() {
  if (typeof caches === 'undefined') {
    return null
  }

  return caches.open(TRANSFORMERS_CACHE_NAME)
}

async function getCachedModelIds() {
  const cache = await getTransformersCache()

  if (!cache) {
    return []
  }

  const requests = await cache.keys()

  return transcriptionModels
    .filter((model) =>
      requests.some((request) => isModelCacheRequest(request.url, model.id)),
    )
    .map((model) => model.id)
}

async function deleteCachedModel(modelId: TranscriptionModelId) {
  const cache = await getTransformersCache()

  if (!cache) {
    return
  }

  const requests = await cache.keys()

  await Promise.all(
    requests.map((request) =>
      isModelCacheRequest(request.url, modelId)
        ? cache.delete(request)
        : Promise.resolve(false),
    ),
  )
}

async function deleteOtherKnownModels(keepModelId: TranscriptionModelId) {
  await Promise.all(
    transcriptionModels
      .filter((model) => model.id !== keepModelId)
      .map((model) => deleteCachedModel(model.id)),
  )
}

async function inspectCache(id: string, preferredModelId: TranscriptionModelId) {
  const cachedModelIds = await getCachedModelIds()
  const selectedModelId = cachedModelIds.includes(preferredModelId)
    ? preferredModelId
    : (cachedModelIds[0] ?? null)

  if (selectedModelId) {
    await deleteOtherKnownModels(selectedModelId)
  }

  postMessageToClient({
    id,
    type: 'cache-inspected',
    cachedModelIds: selectedModelId ? [selectedModelId] : [],
    selectedModelId,
  })
}

function createModelProgressReporter(
  id: string,
  modelId: TranscriptionModelId,
  estimatedDownloadBytes: number,
) {
  const files = new Map<string, { loaded: number; total: number }>()
  let lastProgress = 0

  function postProgress(progress: number) {
    const nextProgress = Math.max(
      lastProgress,
      Math.min(DOWNLOAD_PROGRESS_CEILING, Math.round(progress)),
    )

    if (nextProgress === lastProgress) {
      return
    }

    lastProgress = nextProgress
    postMessageToClient({
      id,
      type: 'model-download-progress',
      modelId,
      progress: nextProgress,
    })
  }

  return (progress: ProgressInfo) => {
    if (progress.status === 'initiate' || progress.status === 'download') {
      postProgress(2)
      return
    }

    if (progress.status === 'progress_total') {
      if (progress.total > 0) {
        const expectedTotal = Math.max(progress.total, estimatedDownloadBytes)

        postProgress(
          (progress.loaded / expectedTotal) * DOWNLOAD_PROGRESS_CEILING,
        )
      }
      return
    }

    if (progress.status === 'progress') {
      files.set(progress.file, {
        loaded: progress.loaded,
        total: progress.total,
      })

      const totals = [...files.values()].reduce(
        (accumulator, fileProgress) => ({
          loaded: accumulator.loaded + fileProgress.loaded,
          total: accumulator.total + fileProgress.total,
        }),
        { loaded: 0, total: 0 },
      )

      if (totals.total > 0) {
        const expectedTotal = Math.max(totals.total, estimatedDownloadBytes)

        postProgress((totals.loaded / expectedTotal) * DOWNLOAD_PROGRESS_CEILING)
      }
    }
  }
}

async function loadModel(id: string, modelId: TranscriptionModelId) {
  if (transcriber && activeModelId === modelId) {
    postMessageToClient({ id, type: 'model-ready', modelId })
    return transcriber
  }

  if (loadingModelPromise) {
    if (loadingModelId !== modelId) {
      throw new Error('Wait for the current model to finish loading first.')
    }

    const loadedTranscriber = await loadingModelPromise
    postMessageToClient({ id, type: 'model-ready', modelId })
    return loadedTranscriber
  }

  loadingModelId = modelId
  loadingModelPromise = (async () => {
    if (transcriber) {
      await transcriber.dispose()
      transcriber = null
      activeModelId = null
    }

    const model = getModel(modelId)

    postMessageToClient({ id, type: 'model-loading', modelId })

    transcriber = await pipeline('automatic-speech-recognition', model.repo, {
      dtype: 'fp32',
      device: 'wasm',
      progress_callback: createModelProgressReporter(
        id,
        modelId,
        model.estimatedDownloadBytes,
      ),
    })
    activeModelId = modelId

    return transcriber
  })()

  try {
    const loadedTranscriber = await loadingModelPromise

    await deleteOtherKnownModels(modelId)
    postMessageToClient({ id, type: 'model-ready', modelId })
    return loadedTranscriber
  } finally {
    loadingModelId = null
    loadingModelPromise = null
  }
}

async function deleteActiveModel(id: string, modelId: TranscriptionModelId) {
  if (transcriber && activeModelId === modelId) {
    await transcriber.dispose()
    transcriber = null
    activeModelId = null
  }

  await deleteCachedModel(modelId)

  postMessageToClient({
    id,
    type: 'model-deleted',
    modelId,
  })
}

function getTranscriptText(result: AutomaticSpeechRecognitionOutput | AutomaticSpeechRecognitionOutput[]) {
  return Array.isArray(result)
    ? result.map((item) => item.text).join('\n')
    : result.text
}

async function handleRequest(message: TranscriptionWorkerRequest) {
  switch (message.type) {
    case 'inspect-cache': {
      await inspectCache(message.id, message.preferredModelId)
      return
    }

    case 'prepare-model': {
      await loadModel(message.id, message.modelId)
      return
    }

    case 'delete-model': {
      await deleteActiveModel(message.id, message.modelId)
      return
    }

    case 'transcribe': {
      const loadedTranscriber = await loadModel(message.id, message.modelId)

      postMessageToClient({
        id: message.id,
        type: 'transcription-started',
      })

      const result = await loadedTranscriber(message.audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
      })

      postMessageToClient({
        id: message.id,
        type: 'transcription-complete',
        text: getTranscriptText(result),
      })
      return
    }
  }
}

self.addEventListener('message', (event: MessageEvent<TranscriptionWorkerRequest>) => {
  void handleRequest(event.data).catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Unknown transcription worker error.'

    postMessageToClient({
      id: event.data.id,
      type: 'worker-error',
      message,
    })
  })
})

postMessageToClient({ type: 'worker-ready' })

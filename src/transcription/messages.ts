import type { TranscriptionModelId } from './models'

export type TranscriptionWorkerRequest =
  | {
      id: string
      type: 'inspect-cache'
      preferredModelId: TranscriptionModelId
    }
  | {
      id: string
      type: 'prepare-model'
      modelId: TranscriptionModelId
    }
  | {
      id: string
      type: 'delete-model'
      modelId: TranscriptionModelId
    }
  | {
      id: string
      type: 'transcribe'
      modelId: TranscriptionModelId
      audio: Float32Array
    }

export type TranscriptionWorkerResponse =
  | {
      type: 'worker-ready'
    }
  | {
      id: string
      type: 'cache-inspected'
      cachedModelIds: TranscriptionModelId[]
      selectedModelId: TranscriptionModelId | null
    }
  | {
      id: string
      type: 'model-loading'
      modelId: TranscriptionModelId
    }
  | {
      id: string
      type: 'model-download-progress'
      modelId: TranscriptionModelId
      progress: number
    }
  | {
      id: string
      type: 'model-ready'
      modelId: TranscriptionModelId
    }
  | {
      id: string
      type: 'model-deleted'
      modelId: TranscriptionModelId
    }
  | {
      id: string
      type: 'transcription-started'
    }
  | {
      id: string
      type: 'transcription-progress'
      progress: number
    }
  | {
      id: string
      type: 'transcription-complete'
      text: string
    }
  | {
      id: string
      type: 'worker-error'
      message: string
    }

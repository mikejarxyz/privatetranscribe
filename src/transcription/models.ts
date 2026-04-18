export const transcriptionModels = [
  {
    id: 'fast-english',
    name: 'Fast English',
    model: 'whisper-tiny.en',
    estimate: '~60 MB',
    estimatedDownloadBytes: 60 * 1024 * 1024,
    note: 'Smallest download, rougher transcript',
    repo: 'onnx-community/whisper-tiny.en',
  },
  {
    id: 'balanced-english',
    name: 'Balanced English',
    model: 'whisper-base.en',
    estimate: '~150 MB',
    estimatedDownloadBytes: 150 * 1024 * 1024,
    note: 'Better accuracy, slower first run',
    repo: 'onnx-community/whisper-base.en',
  },
  {
    id: 'accurate-english',
    name: 'Accurate English',
    model: 'whisper-small.en',
    estimate: '~450 MB',
    estimatedDownloadBytes: 450 * 1024 * 1024,
    note: 'Desktop recommended',
    repo: 'onnx-community/whisper-small.en',
  },
] as const

export type TranscriptionModelId = (typeof transcriptionModels)[number]['id']

export const MAX_BATCH_FILES = 10

export type TranscriptionJobStatus =
  | 'queued'
  | 'preparing'
  | 'transcribing'
  | 'complete'
  | 'error'

export type TranscriptionJob = {
  id: string
  file: File
  status: TranscriptionJobStatus
  transcript: string
  error: string | null
}

export function createTranscriptionJob(file: File): TranscriptionJob {
  return {
    id: crypto.randomUUID(),
    file,
    status: 'queued',
    transcript: '',
    error: null,
  }
}

export function getTranscriptBaseName(fileName: string) {
  const stem = fileName.replace(/\.[^/.]+$/, '') || 'transcript'
  const sanitizedStem = stem
    .split('')
    .map((character) => {
      const code = character.charCodeAt(0)
      if (code < 32 || '<>:"/\\|?*'.includes(character)) {
        return '_'
      }
      return character
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()

  return sanitizedStem || 'transcript'
}

export function getTranscriptFileName(fileName: string) {
  return `${getTranscriptBaseName(fileName)}.txt`
}

export function createUniqueTranscriptFileNames(fileNames: string[]) {
  const seenCounts = new Map<string, number>()

  return fileNames.map((fileName) => {
    const baseName = getTranscriptBaseName(fileName)
    const nextCount = (seenCounts.get(baseName) ?? 0) + 1
    seenCounts.set(baseName, nextCount)
    return nextCount === 1 ? `${baseName}.txt` : `${baseName}-${nextCount}.txt`
  })
}

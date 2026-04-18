const acceptedAudioExtensions = [
  '.aac',
  '.aif',
  '.aiff',
  '.flac',
  '.m4a',
  '.mp3',
  '.mp4',
  '.oga',
  '.ogg',
  '.opus',
  '.wav',
  '.webm',
]

const acceptedAudioMimeTypes = [
  'audio/aac',
  'audio/aiff',
  'audio/flac',
  'audio/m4a',
  'audio/mp3',
  'audio/mp4',
  'audio/mpeg',
  'audio/ogg',
  'audio/opus',
  'audio/wav',
  'audio/webm',
  'audio/x-aiff',
  'audio/x-m4a',
  'audio/x-wav',
  'video/mp4',
  'video/webm',
]

export const acceptedAudioInput = [
  ...acceptedAudioMimeTypes,
  ...acceptedAudioExtensions,
].join(',')

export function isAcceptedAudioFile(file: File) {
  const extension = file.name
    .slice(file.name.lastIndexOf('.'))
    .toLowerCase()

  return (
    acceptedAudioMimeTypes.includes(file.type) ||
    acceptedAudioExtensions.includes(extension)
  )
}

export function getAcceptedAudioLabel() {
  return 'WAV, MP3, M4A, AAC, OGG, OPUS, FLAC, WebM, MP4, or AIFF'
}

export function getAudioFileFormatLabel(file: File) {
  const extensionIndex = file.name.lastIndexOf('.')

  if (extensionIndex >= 0 && extensionIndex < file.name.length - 1) {
    return file.name.slice(extensionIndex + 1).toUpperCase()
  }

  const mimeSubtype = file.type.split('/')[1]?.replace(/^x-/, '')

  return mimeSubtype ? mimeSubtype.toUpperCase() : 'This file type'
}

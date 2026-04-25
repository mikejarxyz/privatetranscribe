import { describe, expect, it } from 'vitest'
import {
  createUniqueTranscriptFileNames,
  getTranscriptBaseName,
  getTranscriptFileName,
} from './jobs'

describe('transcription job helpers', () => {
  it('sanitizes transcript base names', () => {
    expect(getTranscriptBaseName('my:audio?.mp3')).toBe('my_audio_')
    expect(getTranscriptBaseName('   .wav')).toBe('transcript')
  })

  it('creates transcript file names with extension', () => {
    expect(getTranscriptFileName('meeting.m4a')).toBe('meeting.txt')
  })

  it('ensures unique names for duplicate sources', () => {
    expect(
      createUniqueTranscriptFileNames(['clip.wav', 'clip.mp3', 'clip.wav']),
    ).toEqual(['clip.txt', 'clip-2.txt', 'clip-3.txt'])
  })
})

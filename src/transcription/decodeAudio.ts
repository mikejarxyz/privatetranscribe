const targetSampleRate = 16_000

function mixToMono(audioBuffer: AudioBuffer) {
  const channelCount = audioBuffer.numberOfChannels
  const mono = new Float32Array(audioBuffer.length)

  for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
    const channel = audioBuffer.getChannelData(channelIndex)

    for (let sampleIndex = 0; sampleIndex < channel.length; sampleIndex += 1) {
      mono[sampleIndex] += channel[sampleIndex] / channelCount
    }
  }

  return mono
}

function resampleLinear(
  samples: Float32Array,
  sourceSampleRate: number,
  outputSampleRate: number,
) {
  if (sourceSampleRate === outputSampleRate) {
    return samples
  }

  const ratio = sourceSampleRate / outputSampleRate
  const outputLength = Math.max(1, Math.round(samples.length / ratio))
  const output = new Float32Array(outputLength)

  for (let outputIndex = 0; outputIndex < outputLength; outputIndex += 1) {
    const sourceIndex = outputIndex * ratio
    const previousIndex = Math.floor(sourceIndex)
    const nextIndex = Math.min(previousIndex + 1, samples.length - 1)
    const weight = sourceIndex - previousIndex

    output[outputIndex] =
      samples[previousIndex] * (1 - weight) + samples[nextIndex] * weight
  }

  return output
}

export async function decodeAudioFile(file: File) {
  const audioContext = new AudioContext()

  try {
    const audioBuffer = await audioContext.decodeAudioData(await file.arrayBuffer())
    const mono = mixToMono(audioBuffer)

    return resampleLinear(mono, audioBuffer.sampleRate, targetSampleRate)
  } finally {
    await audioContext.close()
  }
}

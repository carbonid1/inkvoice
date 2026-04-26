const getAudioDuration = async (file: File): Promise<number> => {
  const arrayBuffer = await file.arrayBuffer()
  const audioContext = new AudioContext()

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    return audioBuffer.duration
  } finally {
    await audioContext.close()
  }
}

export { getAudioDuration }

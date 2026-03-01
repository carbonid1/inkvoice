export const findWavChunk = (buffer: Buffer, chunkId: string, startOffset = 12): number => {
  let offset = startOffset
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString('ascii', offset, offset + 4)
    if (id === chunkId) return offset
    const size = buffer.readUInt32LE(offset + 4)
    offset += 8 + size
    // WAV chunks are word-aligned (padded to even size)
    if (size % 2 !== 0) offset += 1
  }
  return -1
}

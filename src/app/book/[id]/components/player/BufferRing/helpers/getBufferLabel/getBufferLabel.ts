import { MAX_AHEAD } from '../../BufferRing.consts'

export const getBufferLabel = (ahead: number, isGenerating: boolean): string => {
  if (ahead === 0 && isGenerating) return 'Generating first paragraphs...'
  if (ahead >= MAX_AHEAD) return 'Buffer full'

  const noun = ahead === 1 ? 'paragraph' : 'paragraphs'
  const base = `${ahead} ${noun} ready`

  return isGenerating ? `${base} \u00b7 Generating...` : base
}

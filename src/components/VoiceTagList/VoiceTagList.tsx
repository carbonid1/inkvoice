type VoiceTagListProps = {
  tags: string[]
}

export const VoiceTagList = ({ tags }: VoiceTagListProps) => {
  if (tags.length === 0) return null

  return <span className="text-xs text-gray-500 dark:text-gray-400">{tags.join(', ')}</span>
}

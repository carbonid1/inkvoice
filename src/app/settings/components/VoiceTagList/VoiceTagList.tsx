import { TagBadge } from '../TagBadge/TagBadge'

type VoiceTagListProps = {
  tags: string[]
}

export const VoiceTagList = ({ tags }: VoiceTagListProps) => {
  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(tag => (
        <TagBadge key={tag} tag={tag} />
      ))}
    </div>
  )
}

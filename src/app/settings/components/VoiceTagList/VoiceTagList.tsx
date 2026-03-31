import { TagBadge } from '../TagBadge/TagBadge'

type VoiceTagListProps = {
  tags: string[]
}

export const VoiceTagList = ({ tags }: VoiceTagListProps) => {
  if (tags.length === 0) return null

  return (
    <div className="flex min-w-0 flex-nowrap gap-1 overflow-hidden">
      {tags.map(tag => (
        <TagBadge key={tag} tag={tag} />
      ))}
    </div>
  )
}

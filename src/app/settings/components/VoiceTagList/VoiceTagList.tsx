import { Badge } from '@carbonid1/design-system'

interface Props {
  tags: string[]
}

export const VoiceTagList = ({ tags }: Props) => {
  if (tags.length === 0) return null

  return (
    <div className="flex min-w-0 gap-1 overflow-hidden">
      {tags.map(tag => (
        <Badge key={tag} variant="primary" className="shrink-0">
          {tag}
        </Badge>
      ))}
    </div>
  )
}

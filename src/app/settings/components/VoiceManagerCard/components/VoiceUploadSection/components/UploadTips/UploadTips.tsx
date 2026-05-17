import { BookOpen, Clock, Mic, type LucideIcon } from 'lucide-react'

interface Tip {
  icon: LucideIcon
  title: string
  description: string
}

interface Props {
  minSeconds: number
  maxSeconds: number
}

const buildTips = (minSeconds: number, maxSeconds: number): ReadonlyArray<Tip> => [
  {
    icon: Clock,
    title: `${minSeconds}–${maxSeconds} seconds`,
    description:
      'A few natural sentences — long enough to capture rhythm, short enough to stay clean.',
  },
  {
    icon: Mic,
    title: 'Quiet room, one speaker',
    description: 'No music, no overlap, minimal room reverb.',
  },
  {
    icon: BookOpen,
    title: 'Read how you want a book read',
    description: 'The model copies pace and tone. No whispering.',
  },
]

export const UploadTips = ({ minSeconds, maxSeconds }: Props) => (
  <ul className="space-y-2.5">
    {buildTips(minSeconds, maxSeconds).map(({ icon: Icon, title, description }) => (
      <li key={title} className="flex items-start gap-3">
        <Icon aria-hidden className="text-primary mt-0.5 size-4 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-muted-foreground text-xs">{description}</p>
        </div>
      </li>
    ))}
  </ul>
)

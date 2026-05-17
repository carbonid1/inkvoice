import { Button, buttonVariants, cn } from '@carbonid1/design-system'
import { ArrowRight, Circle, CircleCheck } from 'lucide-react'
import Link from 'next/link'

export type ChecklistStepStatus = 'done' | 'pending'

export interface ChecklistStepAction {
  label: string
  href?: string
  onClick?: () => void
}

interface Props {
  status: ChecklistStepStatus
  title: string
  description: string
  action?: ChecklistStepAction
}

export const ChecklistStep = ({ status, title, description, action }: Props) => {
  const isDone = status === 'done'
  const Icon = isDone ? CircleCheck : Circle

  return (
    <div className="flex items-center gap-3 rounded-lg p-3">
      <Icon
        aria-hidden="true"
        className={cn('size-5 shrink-0', isDone ? 'text-success' : 'text-muted-foreground')}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            isDone && 'text-muted-foreground line-through decoration-1',
          )}
        >
          {title}
        </p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <span className="sr-only">{isDone ? 'complete' : 'incomplete'}</span>
      {action && !isDone && <ChecklistStepActionButton action={action} />}
    </div>
  )
}

const ACTION_BUTTON_CLASSES = cn(
  buttonVariants({ variant: 'outline', size: 'default' }),
  'shrink-0',
)

const ChecklistStepActionButton = ({ action }: { action: ChecklistStepAction }) => {
  if (action.href) {
    return (
      <Link href={action.href} className={ACTION_BUTTON_CLASSES}>
        {action.label}
        <ArrowRight />
      </Link>
    )
  }

  return (
    <Button variant="outline" size="default" onClick={action.onClick} className="shrink-0">
      {action.label}
      <ArrowRight />
    </Button>
  )
}

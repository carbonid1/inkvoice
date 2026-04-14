import { Button } from '@carbonid1/design-system'
import { X } from 'lucide-react'

type RecoveryBannerProps = {
  chapterName: string
  onNavigate: () => void
  onDismiss: () => void
}

export const RecoveryBanner = ({ chapterName, onNavigate, onDismiss }: RecoveryBannerProps) => {
  return (
    <div className="animate-in fade-in slide-in-from-top-2 border-attention-border bg-attention-muted mx-6 mt-4 mb-4 flex items-center justify-between rounded-lg border p-3">
      <p className="text-attention-foreground text-sm">
        You have a bookmark at {chapterName}.{' '}
        <button
          onClick={onNavigate}
          className="text-attention-foreground hover:text-foreground font-medium underline"
        >
          Go there
        </button>
      </p>
      <Button
        variant="attention"
        size="icon"
        onClick={onDismiss}
        className="ml-2 shrink-0"
        aria-label="Dismiss"
      >
        <X />
      </Button>
    </div>
  )
}

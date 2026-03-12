import { PageHeader } from '@/components/PageHeader/PageHeader'

export const PageSkeleton = () => (
  <div className="h-dvh flex flex-col" role="status" aria-label="Loading book">
    <PageHeader>
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-4">
        <div className="w-9 h-9 -ml-2 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-9 h-9 -mr-2 rounded-full bg-muted animate-pulse" />
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-1.5 flex items-center gap-2">
        <div className="flex-1 h-7 bg-muted rounded animate-pulse" />
        <div className="w-32 h-7 bg-muted rounded animate-pulse" />
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-1 flex justify-end">
        <div className="h-4 w-28 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-0.5 bg-muted" />
    </PageHeader>
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
        <div className="h-4 w-4/5 bg-muted rounded animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
      </div>
    </div>
    <div className="flex-shrink-0 bg-background border-t border-border px-4 py-2">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
        <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  </div>
)

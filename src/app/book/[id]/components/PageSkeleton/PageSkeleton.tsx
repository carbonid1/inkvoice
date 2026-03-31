import { PageHeader } from '@/components/PageHeader/PageHeader'

export const PageSkeleton = () => (
  <div className="flex h-dvh flex-col" role="status" aria-label="Loading book">
    <PageHeader>
      <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-2">
        <div className="bg-muted -ml-2 size-9 animate-pulse rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="bg-muted h-5 w-48 animate-pulse rounded-sm" />
          <div className="bg-muted h-4 w-32 animate-pulse rounded-sm" />
        </div>
        <div className="bg-muted -mr-2 size-9 animate-pulse rounded-full" />
      </div>
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 pb-1.5">
        <div className="bg-muted h-7 flex-1 animate-pulse rounded-sm" />
        <div className="bg-muted h-7 w-32 animate-pulse rounded-sm" />
      </div>
      <div className="mx-auto flex max-w-3xl justify-end px-4 pb-1">
        <div className="bg-muted h-4 w-28 animate-pulse rounded-sm" />
      </div>
      <div className="bg-muted h-0.5" />
    </PageHeader>
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 px-6 py-8">
        <div className="bg-muted h-4 w-full animate-pulse rounded-sm" />
        <div className="bg-muted h-4 w-5/6 animate-pulse rounded-sm" />
        <div className="bg-muted h-4 w-4/5 animate-pulse rounded-sm" />
        <div className="bg-muted h-4 w-full animate-pulse rounded-sm" />
        <div className="bg-muted h-4 w-3/4 animate-pulse rounded-sm" />
      </div>
    </div>
    <div className="border-border bg-background shrink-0 border-t px-4 py-2">
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-4">
        <div className="bg-muted size-10 animate-pulse rounded-full" />
        <div className="bg-muted size-14 animate-pulse rounded-full" />
        <div className="bg-muted size-10 animate-pulse rounded-full" />
      </div>
    </div>
  </div>
)

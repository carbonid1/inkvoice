export const PageSkeleton = () => (
  <div className="h-dvh flex flex-col" role="status" aria-label="Loading book">
    <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-3xl mx-auto px-4 py-2 flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 pb-1.5 flex items-center gap-2">
        <div className="flex-1 h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="w-32 h-8 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-4/5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    </div>
    <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
      <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>
    </div>
  </div>
)

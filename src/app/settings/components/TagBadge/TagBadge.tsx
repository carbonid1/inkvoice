type TagBadgeProps = {
  tag: string
  onRemove?: () => void
}

export const TagBadge = ({ tag, onRemove }: TagBadgeProps) => (
  <span
    className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    title={tag}
  >
    <span className="truncate">{tag}</span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${tag}`}
        className="transition-colors hover:text-blue-900 dark:hover:text-blue-100"
      >
        &times;
      </button>
    )}
  </span>
)

type TagBadgeProps = {
  tag: string
  onRemove?: () => void
}

export const TagBadge = ({ tag, onRemove }: TagBadgeProps) => (
  <span
    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 min-w-0 max-w-full"
    title={tag}
  >
    <span className="truncate">{tag}</span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${tag}`}
        className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
      >
        &times;
      </button>
    )}
  </span>
)

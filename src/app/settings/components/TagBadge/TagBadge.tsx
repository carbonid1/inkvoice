type TagBadgeProps = {
  tag: string
  onRemove?: () => void
}

export const TagBadge = ({ tag, onRemove }: TagBadgeProps) => (
  <span
    className="bg-primary-border/30 text-primary inline-flex max-w-full min-w-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs"
    title={tag}
  >
    <span className="truncate">{tag}</span>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${tag}`}
        className="hover:text-primary/80 transition-colors"
      >
        &times;
      </button>
    )}
  </span>
)

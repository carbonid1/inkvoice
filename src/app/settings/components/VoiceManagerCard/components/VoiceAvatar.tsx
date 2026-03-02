type VoiceAvatarProps = {
  displayName: string
  type: 'custom' | 'app'
}

export const VoiceAvatar = ({ displayName, type }: VoiceAvatarProps) => {
  const initial = displayName.charAt(0).toUpperCase()
  const colorClasses =
    type === 'custom'
      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'

  return (
    <span
      className={`w-7 h-7 rounded-full text-xs font-medium flex items-center justify-center shrink-0 ${colorClasses}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  )
}

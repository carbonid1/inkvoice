'use client'

import { useState } from 'react'
import { TagBadge } from '../TagBadge/TagBadge'

type VoiceTagEditorProps = {
  tags: string[]
  onTagsChanged: (tags: string[]) => void
  saving: boolean
}

export const VoiceTagEditor = ({ tags, onTagsChanged, saving }: VoiceTagEditorProps) => {
  const [customInput, setCustomInput] = useState('')

  const handleRemove = (tag: string) => {
    onTagsChanged(tags.filter(t => t !== tag))
  }

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const trimmed = customInput.trim().toLowerCase()
    if (!trimmed) return

    if (!tags.includes(trimmed)) {
      onTagsChanged([...tags, trimmed])
    }
    setCustomInput('')
  }

  return (
    <div className="space-y-3 pt-2">
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <TagBadge key={tag} tag={tag} onRemove={() => handleRemove(tag)} />
          ))}
        </div>
      )}

      <input
        type="text"
        value={customInput}
        onChange={e => setCustomInput(e.target.value)}
        onKeyDown={handleCustomKeyDown}
        placeholder="Add custom tag..."
        disabled={saving}
        className="w-full p-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { TagBadge } from '../TagBadge/TagBadge'

type VoiceTagEditorProps = {
  tags: string[]
  onTagsChanged: (tags: string[]) => void
  saving: boolean
}

export const VoiceTagEditor = ({ tags, onTagsChanged, saving }: VoiceTagEditorProps) => {
  const [tagInput, setTagInput] = useState('')

  const handleRemove = (tag: string) => {
    onTagsChanged(tags.filter(t => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const trimmed = tagInput.trim().toLowerCase()
    if (!trimmed) return

    if (!tags.includes(trimmed)) {
      onTagsChanged([...tags, trimmed])
    }
    setTagInput('')
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
        value={tagInput}
        onChange={e => setTagInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add tag..."
        aria-label="Add tag"
        disabled={saving}
        className="w-full p-1.5 text-xs border border-border rounded bg-background text-foreground focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
      />
    </div>
  )
}

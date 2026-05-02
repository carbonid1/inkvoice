'use client'

import { Loader2, Plus } from 'lucide-react'
import { useRef } from 'react'

interface AddBookCardProps {
  onUpload: (files: FileList) => void
  uploading: boolean
  progress?: { current: number; total: number } | null
}

export const AddBookCard = ({ onUpload, uploading, progress }: AddBookCardProps) => {
  const showCount = progress && progress.total > 1
  const label = showCount ? `Uploading ${progress.current} / ${progress.total}` : 'Uploading...'

  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!uploading) {
      inputRef.current?.click()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files

    if (files && files.length > 0) {
      onUpload(files)
    }
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className="border-border bg-background hover:border-primary-border flex h-full cursor-pointer flex-col rounded-lg border-2 border-dashed p-4 transition-colors"
    >
      <div className="mb-3 flex aspect-2/3 w-full flex-col items-center justify-center gap-2 rounded-sm">
        {uploading ? (
          <>
            <Loader2 className="text-muted-foreground size-10 animate-spin" />
            <span className="text-muted-foreground text-sm">{label}</span>
          </>
        ) : (
          <>
            <Plus className="text-muted-foreground size-10" />
            <span className="text-muted-foreground text-sm">Add Book</span>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".epub"
        multiple
        className="hidden"
        onChange={handleChange}
      />
    </div>
  )
}

'use client'

import { Loader2, Plus } from 'lucide-react'
import { useRef } from 'react'

type AddBookCardProps = {
  onUpload: (files: FileList) => void
  uploading: boolean
}

export const AddBookCard = ({ onUpload, uploading }: AddBookCardProps) => {
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
      className="h-full flex flex-col p-4 border-2 border-dashed border-border rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer bg-background"
    >
      <div className="w-full aspect-[2/3] rounded mb-3 flex flex-col items-center justify-center gap-2">
        {uploading ? (
          <>
            <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
            <span className="text-sm text-muted-foreground">Uploading...</span>
          </>
        ) : (
          <>
            <Plus className="w-10 h-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Add Book</span>
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

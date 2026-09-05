import { useCallback, useState, useRef } from 'react'

interface FileUploaderProps {
  accept: string
  multiple?: boolean
  maxSizeMB?: number
  onFiles: (files: File[]) => void
  icon?: string
  title?: string
  subtitle?: string
}

export default function FileUploader({
  accept,
  multiple = false,
  maxSizeMB = 50,
  onFiles,
  icon = '📄',
  title = 'Drag & Drop your file here, or click to browse',
  subtitle,
}: FileUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const defaultSubtitle = `Maximum file size: ${maxSizeMB}MB • Private & Secure • Instant Processing`

  const validateAndEmit = useCallback((fileList: FileList | null) => {
    if (!fileList) return
    const files = Array.from(fileList)
    const valid = files.filter(f => {
      if (f.size > maxSizeMB * 1024 * 1024) {
        alert(`"${f.name}" exceeds the ${maxSizeMB}MB limit.`)
        return false
      }
      return true
    })
    if (valid.length > 0) {
      onFiles(valid)
    }
    if (inputRef.current) inputRef.current.value = ''
  }, [maxSizeMB, onFiles])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    validateAndEmit(e.dataTransfer.files)
  }, [validateAndEmit])

  return (
    <div
      className={`upload-area ${dragOver ? 'drag-over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={e => { e.preventDefault(); setDragOver(false) }}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={e => validateAndEmit(e.target.files)}
      />
      <div className="relative z-10">
        <span className="upload-icon">{icon}</span>
        <h3 className="text-lg font-semibold text-surface-700 mb-2">{title}</h3>
        <p className="text-sm text-surface-500">{subtitle || defaultSubtitle}</p>
        <button
          type="button"
          className="btn-primary mt-4"
          onClick={e => { e.stopPropagation(); inputRef.current?.click() }}
        >
          Select {multiple ? 'Files' : 'File'}
        </button>
      </div>
    </div>
  )
}

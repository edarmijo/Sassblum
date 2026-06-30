import { useRef } from 'react'

interface FileUploadProps {
  files: File[]
  onChange: (files: File[]) => void
  maxSizeMb?: number
}

/**
 * SRP: file selection UI only. Validation (size/MIME) is delegated to FileValidator (S13)
 * inside the form's validator chain; storage is handled by the backend StorageService.
 */
export function FileUpload({ files, onChange, maxSizeMb = 5 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Array.from(e.target.files ?? []))
  }

  const remove = (i: number) => onChange(files.filter((_, idx) => idx !== i))

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
        onChange={handleChange}
        className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      <p className="text-[11px] text-gray-400 mt-1">Máx. {maxSizeMb} MB por archivo.</p>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1">
          {files.map((file, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
              <span>📎 {file.name}</span>
              <span className="text-gray-400">({(file.size / 1024).toFixed(0)} KB)</span>
              <button type="button" onClick={() => remove(i)} className="text-red-500 hover:text-red-700 ml-auto">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

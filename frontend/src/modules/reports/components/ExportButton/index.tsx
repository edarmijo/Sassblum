import { useState } from 'react'
import { ClipboardCopy, Download, Loader2, Printer } from 'lucide-react'
import type { ReportFormat } from '../../interfaces/IReportsService'
import { Button } from '../../../../core/ui/button'

interface ExportButtonProps {
  onExport: (formato: ReportFormat) => Promise<void>
  onCopy: () => Promise<void>
  onPrint: () => Promise<void>
}

const FORMATS: { value: ReportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
]

/** SRP: exposes the five report actions preserved from the legacy page. */
export function ExportButton({ onExport, onCopy, onPrint }: Readonly<ExportButtonProps>) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handle = async (action: string, operation: () => Promise<void>) => {
    setBusy(action)
    setError(null)
    try {
      await operation()
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : 'No se pudo completar la acción del reporte.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={busy !== null}
          onClick={() => void handle('copy', onCopy)}
        >
          {busy === 'copy'
            ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            : <ClipboardCopy className="h-4 w-4" />}
          Copiar
        </Button>
        {FORMATS.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={busy !== null}
            onClick={() => void handle(value, () => onExport(value))}
          >
            {busy === value
              ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
              : <Download className="h-4 w-4" />}
            {label}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={busy !== null}
          onClick={() => void handle('print', onPrint)}
        >
          {busy === 'print'
            ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            : <Printer className="h-4 w-4" />}
          Imprimir
        </Button>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  )
}

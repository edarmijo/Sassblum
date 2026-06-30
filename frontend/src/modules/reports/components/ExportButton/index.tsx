import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import type { ReportFormat } from '../../interfaces/IReportsService'
import { Button } from '../../../../core/ui/button'

interface ExportButtonProps {
  onExport: (formato: ReportFormat) => Promise<void>
}

const FORMATS: { value: ReportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'excel', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
]

/** SRP: triggers a report export in the chosen format. */
export function ExportButton({ onExport }: ExportButtonProps) {
  const [busy, setBusy] = useState<ReportFormat | null>(null)

  const handle = async (fmt: ReportFormat) => {
    setBusy(fmt)
    try { await onExport(fmt) } finally { setBusy(null) }
  }

  return (
    <div className="flex gap-2">
      {FORMATS.map(({ value, label }) => (
        <Button
          key={value}
          type="button"
          variant="outline"
          size="sm"
          disabled={busy !== null}
          onClick={() => void handle(value)}
        >
          {busy === value
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Download className="h-4 w-4" />}
          {label}
        </Button>
      ))}
    </div>
  )
}

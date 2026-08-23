import type { IdentificationType } from '../../interfaces/IAuthService'
import { IDENTIFICATION_LENGTH } from '../../validators/IdentificationValidator'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../core/ui/select'

interface IdentificationFieldsProps {
  idPrefix: string
  type: IdentificationType
  value: string
  error?: string | null
  required?: boolean
  onTypeChange: (type: IdentificationType) => void
  onValueChange: (value: string) => void
}

export function IdentificationFields({
  idPrefix,
  type,
  value,
  error,
  required = true,
  onTypeChange,
  onValueChange,
}: Readonly<IdentificationFieldsProps>) {
  const length = IDENTIFICATION_LENGTH[type]
  const label = type === 'RUC' ? 'RUC' : 'Cédula'
  const helpId = `${idPrefix}-identification-help`
  const errorId = `${idPrefix}-identification-error`
  const describedBy = error ? `${helpId} ${errorId}` : helpId

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr]">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-identification-type`}>Tipo de identificación</Label>
        <Select value={type} onValueChange={(next) => onTypeChange(next as IdentificationType)}>
          <SelectTrigger
            id={`${idPrefix}-identification-type`}
            aria-label="Tipo de identificación"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="RUC">RUC</SelectItem>
            <SelectItem value="Cedula">Cédula</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-identification-number`}>{label}</Label>
        <Input
          id={`${idPrefix}-identification-number`}
          inputMode="numeric"
          autoComplete="off"
          required={required}
          maxLength={length}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          placeholder={type === 'RUC' ? 'Ej: 0991234567001' : 'Ej: 0912345678'}
        />
        <p id={helpId} aria-live="polite" className="text-xs text-muted-foreground">
          Ingresa exactamente {length} dígitos, sin espacios ni guiones.
        </p>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

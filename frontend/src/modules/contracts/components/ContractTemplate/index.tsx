import { useState } from 'react'
import { FileText, Download, Printer } from 'lucide-react'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import { Textarea } from '../../../../core/ui/textarea'

/**
 * H#9 (cliente): Plantilla base de contratos de servicios.
 * Vicky Pinto: "Si tengo el formato del contrato de servicios, ahí sí es más seguro
 * porque son cláusulas que solo se cambian ciertas cosas."
 *
 * SRP: renders contract template form + preview.
 * The admin fills in variable fields and can print/download the contract.
 */

const CONTRACT_TEMPLATE = `CONTRATO DE PRESTACIÓN DE SERVICIOS TECNOLÓGICOS

Entre: SASS BLUM, representada por su representante legal, en adelante "EL PROVEEDOR"
Y: {{CLIENTE_NOMBRE}}, con RUC {{CLIENTE_RUC}}, en adelante "EL CLIENTE"

PRIMERA - OBJETO DEL CONTRATO
EL PROVEEDOR se compromete a prestar los siguientes servicios tecnológicos al CLIENTE:
{{SERVICIOS_DESCRIPCION}}

SEGUNDA - VIGENCIA
El presente contrato tendrá una vigencia desde el {{FECHA_INICIO}} hasta el {{FECHA_FIN}}.

TERCERA - VALOR Y FORMA DE PAGO
El valor total del presente contrato asciende a \${{VALOR_TOTAL}} ({{VALOR_LETRAS}}).
Forma de pago: {{FORMA_PAGO}}

CUARTA - OBLIGACIONES DEL PROVEEDOR
• Prestar los servicios contratados con la mayor diligencia profesional.
• Mantener la confidencialidad de la información del CLIENTE.
• Proporcionar soporte técnico durante el horario laboral establecido.

QUINTA - OBLIGACIONES DEL CLIENTE
• Facilitar el acceso necesario para la prestación de los servicios.
• Realizar los pagos en los plazos acordados.
• Comunicar oportunamente cualquier incidencia o requerimiento.

SEXTA - CONFIDENCIALIDAD
Las partes se comprometen a mantener estricta confidencialidad sobre toda la información
recibida durante la vigencia del presente contrato.

SÉPTIMA - RESOLUCIÓN
El presente contrato podrá resolverse por mutuo acuerdo de las partes o por incumplimiento
de cualquiera de las obligaciones establecidas.

En la ciudad de Guayaquil, a los {{DIA}} días del mes de {{MES}} de {{AÑO}}.


_________________________                    _________________________
EL PROVEEDOR                                 EL CLIENTE
SASS BLUM                                    {{CLIENTE_NOMBRE}}`

interface ContractField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'date'
  placeholder: string
}

const CONTRACT_FIELDS: ContractField[] = [
  { key: 'CLIENTE_NOMBRE', label: 'Nombre del cliente', type: 'text', placeholder: 'Empresa XYZ S.A.' },
  { key: 'CLIENTE_RUC', label: 'RUC del cliente', type: 'text', placeholder: '0991234567001' },
  { key: 'SERVICIOS_DESCRIPCION', label: 'Servicios contratados', type: 'textarea', placeholder: 'Instalación de CCTV, cableado estructurado...' },
  { key: 'FECHA_INICIO', label: 'Fecha de inicio', type: 'date', placeholder: '' },
  { key: 'FECHA_FIN', label: 'Fecha de fin', type: 'date', placeholder: '' },
  { key: 'VALOR_TOTAL', label: 'Valor total ($)', type: 'text', placeholder: '5,000.00' },
  { key: 'VALOR_LETRAS', label: 'Valor en letras', type: 'text', placeholder: 'Cinco mil dólares' },
  { key: 'FORMA_PAGO', label: 'Forma de pago', type: 'text', placeholder: 'Transferencia bancaria, 50% anticipo' },
  { key: 'DIA', label: 'Día de firma', type: 'text', placeholder: '25' },
  { key: 'MES', label: 'Mes de firma', type: 'text', placeholder: 'junio' },
  { key: 'AÑO', label: 'Año de firma', type: 'text', placeholder: '2026' },
]

export function ContractTemplate() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [showPreview, setShowPreview] = useState(false)

  const updateField = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const generateContract = (): string => {
    let contract = CONTRACT_TEMPLATE
    for (const [key, value] of Object.entries(values)) {
      contract = contract.replaceAll(`{{${key}}}`, value || `[${key}]`)
    }
    return contract
  }

  const handlePrint = () => {
    setShowPreview(true)
    setTimeout(() => globalThis.print(), 300)
  }

  const handleDownload = () => {
    const contract = generateContract()
    const blob = new Blob([contract], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contrato_${values.CLIENTE_NOMBRE || 'borrador'}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-cyan" />
          Plantilla de Contratos
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Completa los campos para generar un borrador de contrato de servicios.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-4">
          {CONTRACT_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={`contract-${field.key}`}>{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={`contract-${field.key}`}
                  value={values[field.key] ?? ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                />
              ) : (
                <Input
                  id={`contract-${field.key}`}
                  type={field.type === 'date' ? 'date' : 'text'}
                  value={values[field.key] ?? ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button onClick={() => setShowPreview(true)} className="bg-brand-cyan hover:bg-brand-cyan-dark text-brand-navy font-semibold">
              <FileText className="h-4 w-4 mr-2" />Vista previa
            </Button>
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />Descargar
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />Imprimir
            </Button>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="bg-white border border-border rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4">Vista previa del contrato</h3>
            <pre className="whitespace-pre-wrap text-xs text-foreground/90 leading-relaxed font-mono bg-slate-50 p-4 rounded-lg max-h-150 overflow-y-auto">
              {generateContract()}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

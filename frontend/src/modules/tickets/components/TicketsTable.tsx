import { Eye } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../core/ui/table'
import { Button } from '../../../core/ui/button'
import { StatusBadge, PriorityBadge } from './ticketBadges'
import type { TicketSummary } from '../interfaces/ITicketService'

interface TicketsTableProps {
  tickets: TicketSummary[]
  onView: (id: string) => void
  /** Muestra columnas extra: Empresa, RUC, Asignado. Solo para el panel de admin. */
  isAdmin?: boolean
}

export function TicketsTable({ tickets, onView, isAdmin = false }: Readonly<TicketsTableProps>) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,196,224,0.12)' }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="[&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:font-semibold">
              <TableRow style={{ background: 'rgba(0,196,224,0.06)' }}>
                <TableHead>Número</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Asunto</TableHead>
                {isAdmin && <TableHead>Empresa</TableHead>}
                {isAdmin && <TableHead>RUC</TableHead>}
                {isAdmin && <TableHead>Asignado</TableHead>}
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 10 : 7} className="text-center py-10 text-[#7aa3b8]">No se encontraron tickets</TableCell>
                </TableRow>
              ) : (
                tickets.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => onView(t.id)}>
                    <TableCell className="font-mono font-medium text-[#eef4f8]">{t.numero}</TableCell>
                    <TableCell>{t.servicioNombre}</TableCell>
                    <TableCell className="max-w-xs truncate">{t.asunto}</TableCell>
                    {isAdmin && (
                      <TableCell className="max-w-[140px] truncate text-sm text-[#b8d0e0]">
                        {t.clienteEmpresa || <span className="text-[#4a6a7a] italic">—</span>}
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell className="font-mono text-xs text-[#b8d0e0]">
                        {t.clienteRuc || <span className="text-[#4a6a7a] italic">—</span>}
                      </TableCell>
                    )}
                    {isAdmin && (
                      <TableCell className="text-sm text-[#b8d0e0] max-w-[140px]">
                        {t.asignadoNombre
                          ? <span title={t.asignadoEmail ?? undefined}>{t.asignadoNombre}</span>
                          : <span className="text-[#4a6a7a] italic">Sin asignar</span>}
                      </TableCell>
                    )}
                    <TableCell><StatusBadge estado={t.estado} /></TableCell>
                    <TableCell><PriorityBadge prioridad={t.prioridad} /></TableCell>
                    <TableCell>{new Date(t.creadoEn).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); onView(t.id) }}
                        aria-label="Ver ticket"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-sm text-[#7aa3b8]">Mostrando {tickets.length} tickets</p>
    </div>
  )
}


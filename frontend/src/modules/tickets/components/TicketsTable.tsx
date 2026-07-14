import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../core/ui/table'
import { Button } from '../../../core/ui/button'
import { Input } from '../../../core/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../core/ui/select'
import { StatusBadge, PriorityBadge } from './ticketBadges'
import type { TicketSummary } from '../interfaces/ITicketService'

interface TicketsTableProps {
  tickets: TicketSummary[]
  onView: (id: string) => void
}

export function TicketsTable({ tickets, onView }: Readonly<TicketsTableProps>) {
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState('all')

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase()
    const matchesSearch =
      t.numero.toLowerCase().includes(q) ||
      t.asunto.toLowerCase().includes(q) ||
      t.servicioNombre.toLowerCase().includes(q)
    const matchesEstado = estado === 'all' || t.estado === estado
    return matchesSearch && matchesEstado
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input className="flex-1" placeholder="Buscar por número, asunto o servicio…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="Nuevo">Nuevo</SelectItem>
            <SelectItem value="EnProceso">En Proceso</SelectItem>
            <SelectItem value="EnEspera">En Espera</SelectItem>
            <SelectItem value="Resuelto">Resuelto</SelectItem>
            <SelectItem value="Cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg overflow-hidden" style={{ border: '1px solid rgba(0,196,224,0.12)' }}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="[&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:font-semibold">
              <TableRow style={{ background: 'rgba(0,196,224,0.06)' }}>
                <TableHead>Número</TableHead>
                <TableHead>Servicio</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-[#5c7a94]">No se encontraron tickets</TableCell>
                </TableRow>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => onView(t.id)}>
                    <TableCell className="font-mono font-medium text-[#eef4f8]">{t.numero}</TableCell>
                    <TableCell>{t.servicioNombre}</TableCell>
                    <TableCell className="max-w-xs truncate">{t.asunto}</TableCell>
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

      <p className="text-sm text-[#5c7a94]">Mostrando {filtered.length} de {tickets.length} tickets</p>
    </div>
  )
}

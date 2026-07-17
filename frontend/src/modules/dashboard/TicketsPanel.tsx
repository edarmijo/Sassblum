import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Plus, Ticket as TicketIcon, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { DashboardTabs, DashboardTabsList, DashboardTabsTrigger, DashboardTabsContent, DashboardTabsStyle } from '../../core/ui/DashboardTabs'
import { DashboardCard, DashboardCardHeader, DashboardCardTitle, DashboardCardDescription, DashboardCardContent } from '../../core/ui/DashboardCard'
import { Skeleton } from '../../core/ui/skeleton'
import { GlowCard } from '../../core/ui/GlowCard'
import { Reveal, FocusReveal } from '../../core/ui/motion'
import { EASE_APPLE } from '../../core/ui/motion/ease'
import { PageHero } from '../../core/ui/layout/PageHero'
import { useTicketsList } from '../tickets/hooks/useTickets'
import { TicketsTable } from '../tickets/components/TicketsTable'
import { TicketFilters } from '../tickets/components/TicketFilters'
import { CreateTicketPage } from '../tickets/pages/CreateTicketPage'
import type { TicketSummary, TicketFilterOptions } from '../tickets/interfaces/ITicketService'

function StatCard({ label, value, icon: Icon, chip }: Readonly<{ label: string; value: number; icon: LucideIcon; chip: string }>) {
  return (
    <GlowCard
      className="ring-1 ring-white/5"
      glowColor="rgba(0, 196, 224, 0.18)"
      style={{
        background: 'rgba(8,22,36,0.78)',
        border: '1px solid rgba(0,196,224,0.12)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="flex items-center gap-4 p-5">
        <motion.div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chip}`}
          whileHover={{ scale: 1.1, rotate: -6 }}
          transition={{ duration: 0.25, ease: EASE_APPLE }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div className="min-w-0">
          <p className="text-sm text-[#5c7a94] truncate">{label}</p>
          <p className="text-2xl font-bold text-[#eef4f8] tabular-nums">{value}</p>
        </div>
      </div>
    </GlowCard>
  )
}

function computeStats(tickets: TicketSummary[]) {
  const cerrados = (e: TicketSummary['estado']) => e === 'Resuelto' || e === 'Cerrado'
  return {
    total: tickets.length,
    activos: tickets.filter((t) => !cerrados(t.estado)).length,
    resueltos: tickets.filter((t) => cerrados(t.estado)).length,
    enProceso: tickets.filter((t) => t.estado === 'EnProceso').length,
  }
}

interface TicketsPanelProps {
  title: string
  subtitle: string
  showCreate?: boolean
}

// Claves estables para los skeletons de las stat cards (sin índice como key)
const STAT_SKELETON_KEYS = Array.from({ length: 4 }, (_, i) => `stat-skeleton-${i}`)

export function TicketsPanel({ title, subtitle, showCreate = false }: Readonly<TicketsPanelProps>) {
  const [ticketFilters, setTicketFilters] = useState<TicketFilterOptions>({})
  const { tickets, isLoading, error } = useTicketsList(ticketFilters)
  const navigate = useNavigate()
  const stats = computeStats(tickets)

  return (
    <div className="min-h-screen">
      {/* Hero con glow y orbes animados — mismo estilo que páginas públicas */}
      <PageHero
        eyebrow="Dashboard"
        title={title}
        subtitle={subtitle}
        accent="cyan"
        orbPosition="top-right"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-12">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {isLoading ? (
            STAT_SKELETON_KEYS.map((k) => <Skeleton key={k} className="h-21 rounded-xl" style={{ background: 'rgba(8,22,36,0.5)' }} />)
          ) : (
            <>
              <FocusReveal delay={0}><StatCard label="Total de Tickets" value={stats.total} icon={TicketIcon} chip="bg-brand-navy/20 text-brand-cyan" /></FocusReveal>
              <FocusReveal delay={0.07}><StatCard label="Activos" value={stats.activos} icon={Clock} chip="bg-warning/15 text-warning" /></FocusReveal>
              <FocusReveal delay={0.14}><StatCard label="Resueltos" value={stats.resueltos} icon={CheckCircle2} chip="bg-success/15 text-success" /></FocusReveal>
              <FocusReveal delay={0.21}><StatCard label="En Proceso" value={stats.enProceso} icon={Loader2} chip="bg-brand-cyan/15 text-brand-cyan" /></FocusReveal>
            </>
          )}
        </div>

        {/* Tabs with glassmorphism */}
        <Reveal y={16}>
          <DashboardTabsStyle />
          <DashboardTabs defaultValue="list" className="space-y-6">
            <DashboardTabsList>
              <DashboardTabsTrigger value="list"><TicketIcon className="h-4 w-4 mr-2" />Tickets</DashboardTabsTrigger>
              {showCreate && <DashboardTabsTrigger value="create"><Plus className="h-4 w-4 mr-2" />Crear Ticket</DashboardTabsTrigger>}
            </DashboardTabsList>

            <DashboardTabsContent value="list">
              <DashboardCard>
                <DashboardCardHeader>
                  <DashboardCardTitle>Listado de Tickets</DashboardCardTitle>
                  <DashboardCardDescription>Historial completo de solicitudes</DashboardCardDescription>
                </DashboardCardHeader>
                <DashboardCardContent>
                  {error && <p className="text-red-400 mb-4">{error}</p>}
                  <TicketFilters filters={ticketFilters} onChange={setTicketFilters} />
                  {isLoading ? (
                    <Skeleton className="h-48 w-full rounded-lg" style={{ background: 'rgba(8,22,36,0.5)' }} />
                  ) : (
                    <TicketsTable tickets={tickets} onView={(id) => navigate(`/tickets/${id}`)} />
                  )}
                </DashboardCardContent>
              </DashboardCard>
            </DashboardTabsContent>

            {showCreate && (
              <DashboardTabsContent value="create">
                <DashboardCard>
                  <DashboardCardHeader>
                    <DashboardCardTitle>Crear Nuevo Ticket</DashboardCardTitle>
                    <DashboardCardDescription>Completa el formulario para solicitar un servicio</DashboardCardDescription>
                  </DashboardCardHeader>
                  <DashboardCardContent>
                    <CreateTicketPage
                      onCreated={(id, numero) => {
                        // Paridad LN-1 (sistema legado): confirmar el número asignado al cliente
                        toast.success(`Se te asignó el ticket ${numero}`)
   
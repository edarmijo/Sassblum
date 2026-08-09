import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket as TicketIcon, Users, BarChart3, Package, Images, BadgeCheck, ImagePlus } from 'lucide-react'
import { DashboardTabs, DashboardTabsList, DashboardTabsTrigger, DashboardTabsContent, DashboardTabsStyle } from '../../core/ui/DashboardTabs'
import { DashboardCard, DashboardCardHeader, DashboardCardTitle, DashboardCardDescription, DashboardCardContent } from '../../core/ui/DashboardCard'
import { Skeleton } from '../../core/ui/skeleton'
import { FocusReveal } from '../../core/ui/motion'
import { PageHero } from '../../core/ui/layout/PageHero'
import { useTicketsList } from '../tickets/hooks/useTickets'
import { TicketsTable } from '../tickets/components/TicketsTable'
import { TicketFilters } from '../tickets/components/TicketFilters'
import { AdminUserPage } from '../auth/pages/AdminUserPage'
import { ReportsDashboard } from '../reports/components/ReportsDashboard'
import { ReportsProvider } from '../reports/hooks/ReportsProvider'
import { reportsService } from '../reports/services/ReportsService'
import { CatalogAdminPanel } from '../catalog/components/CatalogAdminPanel'
import { GalleryAdminPanel } from '../gallery/components/GalleryAdminPanel'
import { ClientLogosAdminPage } from '../clients/pages/ClientLogosAdminPage'
import { ServiceDetailAdminPanel } from '../catalog/components/ServiceDetailAdminPanel'
import type { TicketFilterOptions } from '../tickets/interfaces/ITicketService'

export function AdminDashboard() {
  const [ticketFilters, setTicketFilters] = useState<TicketFilterOptions>({})
  const { tickets, isLoading, error } = useTicketsList(ticketFilters)
  const navigate = useNavigate()

  return (
    <div className="min-h-screen">
      {/* Hero con glow y orbes animados */}
      <PageHero
        eyebrow="Administración"
        title="Panel de Admin"
        subtitle="Gestiona tickets, usuarios, catálogo y reportes del sistema"
        accent="indigo"
        orbPosition="bottom-right"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-12">
        <FocusReveal>
          <DashboardTabsStyle />
          <DashboardTabs defaultValue="tickets" className="space-y-6">
            <DashboardTabsList>
              <DashboardTabsTrigger value="tickets"><TicketIcon className="h-4 w-4 mr-2" />Tickets</DashboardTabsTrigger>
              <DashboardTabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Usuarios</DashboardTabsTrigger>
              <DashboardTabsTrigger value="catalog"><Package className="h-4 w-4 mr-2" />Catálogo</DashboardTabsTrigger>
              <DashboardTabsTrigger value="gallery"><Images className="h-4 w-4 mr-2" />Galería</DashboardTabsTrigger>
              <DashboardTabsTrigger value="clients"><BadgeCheck className="h-4 w-4 mr-2" />Clientes</DashboardTabsTrigger>
              <DashboardTabsTrigger value="reports"><BarChart3 className="h-4 w-4 mr-2" />Reportes</DashboardTabsTrigger>
              <DashboardTabsTrigger value="service-details"><ImagePlus className="h-4 w-4 mr-2" />Detalle de servicios</DashboardTabsTrigger>
            </DashboardTabsList>

            <DashboardTabsContent value="tickets">
              <DashboardCard>
                <DashboardCardHeader>
                  <DashboardCardTitle>Gestión de Tickets</DashboardCardTitle>
                  <DashboardCardDescription>Todos los tickets del sistema</DashboardCardDescription>
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

            <DashboardTabsContent value="users"><AdminUserPage /></DashboardTabsContent>

            <DashboardTabsContent value="catalog"><CatalogAdminPanel /></DashboardTabsContent>

            <DashboardTabsContent value="gallery"><GalleryAdminPanel /></DashboardTabsContent>

            <DashboardTabsContent value="clients"><ClientLogosAdminPage /></DashboardTabsContent>

            <DashboardTabsContent value="reports">
              <ReportsProvider service={reportsService}>
                <ReportsDashboard />
              </ReportsProvider>
            </DashboardTabsContent>

            <DashboardTabsContent value="service-details">
              <ServiceDetailAdminPanel />
            </DashboardTabsContent>
          </DashboardTabs>
        </FocusReveal>
      </div>
    </div>
  )
}

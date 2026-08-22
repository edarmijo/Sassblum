import { lazy, Suspense, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket as TicketIcon, Users, BarChart3, Package, Images, BadgeCheck, ImagePlus, MessageSquareQuote } from 'lucide-react'
import { DashboardTabs, DashboardTabsList, DashboardTabsTrigger, DashboardTabsContent, DashboardTabsStyle } from '../../core/ui/DashboardTabs'
import { DashboardCard, DashboardCardHeader, DashboardCardTitle, DashboardCardDescription, DashboardCardContent } from '../../core/ui/DashboardCard'
import { Skeleton } from '../../core/ui/skeleton'
import { FocusReveal } from '../../core/ui/motion'
import { PageHero } from '../../core/ui/layout/PageHero'
import { useTabParam } from '../../core/hooks/useTabParam'
import { useOriginState } from '../../core/hooks/useBackTarget'
import { useTicketsList } from '../tickets/hooks/useTickets'
import { TicketsTable } from '../tickets/components/TicketsTable'
import { TicketFilters } from '../tickets/components/TicketFilters'
import type { TicketFilterOptions } from '../tickets/interfaces/ITicketService'

const AdminUserPage = lazy(() => import('../auth/pages/AdminUserPage').then((module) => ({ default: module.AdminUserPage })))
const CatalogAdminPanel = lazy(() => import('../catalog/components/CatalogAdminPanel').then((module) => ({ default: module.CatalogAdminPanel })))
const GalleryAdminPanel = lazy(() => import('../gallery/components/GalleryAdminPanel').then((module) => ({ default: module.GalleryAdminPanel })))
const ClientLogosAdminPage = lazy(() => import('../clients/pages/ClientLogosAdminPage').then((module) => ({ default: module.ClientLogosAdminPage })))
const ReportsAdminTab = lazy(() => import('../reports/components/ReportsAdminTab').then((module) => ({ default: module.ReportsAdminTab })))
const ServiceDetailAdminPanel = lazy(() => import('../catalog/components/ServiceDetailAdminPanel').then((module) => ({ default: module.ServiceDetailAdminPanel })))
const TestimonialAdminPanel = lazy(() => import('../testimonials/components/TestimonialAdminPanel').then((module) => ({ default: module.TestimonialAdminPanel })))

const ADMIN_TAB_FALLBACK = <Skeleton className="h-48 w-full rounded-lg" style={{ background: 'rgba(8,22,36,0.5)' }} />

/** Pestañas admitidas en `?tab=`; el orden es el de la barra de pestañas. */
const ADMIN_TABS = ['tickets', 'users', 'catalog', 'gallery', 'clients', 'testimonials', 'reports', 'service-details'] as const

export function AdminDashboard() {
  const [ticketFilters, setTicketFilters] = useState<TicketFilterOptions>({})
  const { tickets, isLoading, error } = useTicketsList(ticketFilters)
  const navigate = useNavigate()
  const tab = useTabParam('tickets', ADMIN_TABS)
  const origin = useOriginState()

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
          <DashboardTabs value={tab.value} onValueChange={tab.onValueChange} className="space-y-6">
            <DashboardTabsList>
              <DashboardTabsTrigger value="tickets"><TicketIcon className="h-4 w-4 mr-2" />Tickets</DashboardTabsTrigger>
              <DashboardTabsTrigger value="users"><Users className="h-4 w-4 mr-2" />Usuarios</DashboardTabsTrigger>
              <DashboardTabsTrigger value="catalog"><Package className="h-4 w-4 mr-2" />Catálogo</DashboardTabsTrigger>
              <DashboardTabsTrigger value="gallery"><Images className="h-4 w-4 mr-2" />Galería</DashboardTabsTrigger>
              <DashboardTabsTrigger value="clients"><BadgeCheck className="h-4 w-4 mr-2" />Clientes</DashboardTabsTrigger>
              <DashboardTabsTrigger value="testimonials"><MessageSquareQuote className="h-4 w-4 mr-2" />Testimonios</DashboardTabsTrigger>
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
                    <TicketsTable tickets={tickets} onView={(id) => navigate(`/tickets/${id}`, { state: origin })} />
                  )}
                </DashboardCardContent>
              </DashboardCard>
            </DashboardTabsContent>

            <DashboardTabsContent value="users"><Suspense fallback={ADMIN_TAB_FALLBACK}><AdminUserPage /></Suspense></DashboardTabsContent>

            <DashboardTabsContent value="catalog"><Suspense fallback={ADMIN_TAB_FALLBACK}><CatalogAdminPanel /></Suspense></DashboardTabsContent>

            <DashboardTabsContent value="gallery"><Suspense fallback={ADMIN_TAB_FALLBACK}><GalleryAdminPanel /></Suspense></DashboardTabsContent>

            <DashboardTabsContent value="clients"><Suspense fallback={ADMIN_TAB_FALLBACK}><ClientLogosAdminPage /></Suspense></DashboardTabsContent>

            <DashboardTabsContent value="testimonials"><Suspense fallback={ADMIN_TAB_FALLBACK}><TestimonialAdminPanel /></Suspense></DashboardTabsContent>

            <DashboardTabsContent value="reports">
              <Suspense fallback={ADMIN_TAB_FALLBACK}><ReportsAdminTab /></Suspense>
            </DashboardTabsContent>

            <DashboardTabsContent value="service-details">
              <Suspense fallback={ADMIN_TAB_FALLBACK}><ServiceDetailAdminPanel /></Suspense>
            </DashboardTabsContent>
          </DashboardTabs>
        </FocusReveal>
      </div>
    </div>
  )
}

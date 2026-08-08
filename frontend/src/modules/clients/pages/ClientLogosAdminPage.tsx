import { ClientLogosAdminPanel } from '../components/ClientLogosAdminPanel'
import { ClientLogoProvider } from '../hooks/ClientLogoProvider'
import { clientLogoService } from '../services/ClientLogoService'

/** Admin-only composition boundary for client-logo management. */
export function ClientLogosAdminPage() {
  return (
    <ClientLogoProvider service={clientLogoService}>
      <ClientLogosAdminPanel />
    </ClientLogoProvider>
  )
}

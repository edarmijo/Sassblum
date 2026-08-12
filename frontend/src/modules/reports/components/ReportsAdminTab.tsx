import { ReportsDashboard } from './ReportsDashboard'
import { ReportsProvider } from '../hooks/ReportsProvider'
import { reportsService } from '../services/ReportsService'

/** Composition boundary that keeps reports code out of the initial admin tab. */
export function ReportsAdminTab() {
  return (
    <ReportsProvider service={reportsService}>
      <ReportsDashboard />
    </ReportsProvider>
  )
}

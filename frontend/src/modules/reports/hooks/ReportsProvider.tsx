/**
 * ReportsProvider — separado de useReports.tsx para que cada archivo exporte
 * solo componentes o solo hooks (Fast Refresh). DIP: inyecta IReportsService.
 */

import type { ReactNode } from 'react'
import type { IReportsService } from '../interfaces/IReportsService'
import { ReportsServiceContext } from './useReports'

export function ReportsProvider({ service, children }: Readonly<{ service: IReportsService; children: ReactNode }>) {
  return <ReportsServiceContext.Provider value={service}>{children}</ReportsServiceContext.Provider>
}

/**
 * CatalogProvider — separado de useCatalog.tsx para que cada archivo exporte
 * solo componentes o solo hooks (Fast Refresh). DIP: inyecta ICatalogClientView.
 */

import type { ReactNode } from 'react'
import type { ICatalogClientView } from '../interfaces/ICatalogClientView'
import { CatalogServiceContext } from './useCatalog'

export function CatalogProvider({ service, children }: Readonly<{ service: ICatalogClientView; children: ReactNode }>) {
  return <CatalogServiceContext.Provider value={service}>{children}</CatalogServiceContext.Provider>
}

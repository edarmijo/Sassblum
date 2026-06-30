/**
 * ISP interface exposing only what a CLIENT user needs from the catalog.
 *
 * Responsibility (SRP): read-only browse operations that a client performs.
 *     A client browses active services and views one before creating a ticket.
 * Depends on: ServiceSummary, ServiceDetail, ServiceFilterOptions from ICatalogService.
 * Pattern: ISP — useCatalog hook uses this, never the full ICatalogService.
 * SOLID: ISP · DIP · OCP
 *
 * Why NOT a subset of ICatalogService:
 *     If ICatalogService grows with admin or internal methods, extending it would
 *     expose those method names to client hooks (ISP violation). This interface
 *     is intentionally isolated.
 *
 * OCP: new read-only client operation = new method here. ICatalogAdminView unaffected.
 */

import type { ServiceSummary, ServiceDetail, ServiceFilterOptions } from './ICatalogService'

export interface ICatalogClientView {
  /** Browse all active services. Optional filter by category or free-text search. */
  getActiveServices(filters?: ServiceFilterOptions): Promise<ServiceSummary[]>

  /** View full detail of one active service before creating a support ticket. */
  getServiceDetail(id: string): Promise<ServiceDetail>
}

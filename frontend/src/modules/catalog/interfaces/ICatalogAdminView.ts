/**
 * ISP interface exposing only what an ADMIN user needs to manage the catalog.
 *
 * Responsibility (SRP): write/management operations that an admin performs.
 *     An admin creates, edits, and toggles services — no client-browse semantics.
 * Depends on: ServiceCreatePayload, ServiceEditPayload, ServiceDetail from ICatalogService.
 * Pattern: ISP — admin components use this, never ICatalogClientView.
 * SOLID: ISP · DIP · OCP
 *
 * Why separate from ICatalogClientView:
 *     The admin interface does not need getActiveServices with client-browse semantics.
 *     Merging both would force admin components to depend on methods they never call
 *     (ISP violation).
 *
 * OCP: new admin operation (e.g. bulkToggle) = new method here. Client view unaffected.
 */

import type { ServiceCreatePayload, ServiceEditPayload, ServiceDetail } from './ICatalogService'

export interface ICatalogAdminView {
  /** Create a new service entry in the catalog. */
  createService(data: ServiceCreatePayload): Promise<ServiceDetail>

  /** Partially update fields of an existing service. */
  editService(id: string, data: ServiceEditPayload): Promise<ServiceDetail>

  /** Toggle the active/inactive state of a service. */
  toggleActive(id: string): Promise<ServiceDetail>
}

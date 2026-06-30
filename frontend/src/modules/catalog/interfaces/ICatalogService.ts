/**
 * Root contract for all catalog operations in the frontend.
 *
 * Responsibility (SRP): declare the complete catalog operation contract.
 *     No HTTP calls, no state management — only method signatures and shared types.
 * Depends on: nothing — root abstraction.
 * Pattern: DIP anchor — CatalogService (Singleton) will implement this in S11.
 * SOLID: DIP · OCP · LSP
 *
 * OCP extension: new catalog operation = new method signature here + implementation
 *     in CatalogService. ICatalogClientView and ICatalogAdminView remain frozen.
 */

// ─── Shared data shapes ──────────────────────────────────────────────────────

export interface ServiceSummary {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  activo: boolean
  imagenUrl: string
}

export interface ServiceDetail extends ServiceSummary {
  creadoEn: string       // ISO 8601
  actualizadoEn: string  // ISO 8601
}

export interface ServiceFilterOptions {
  categoria?: string
  busqueda?: string
}

export interface ServiceCreatePayload {
  nombre: string
  descripcion: string
  categoria: string
}

export interface ServiceEditPayload {
  nombre?: string
  descripcion?: string
  categoria?: string
}

// ─── Service contract ─────────────────────────────────────────────────────────

export interface ICatalogService {
  /** Return all active services, optionally filtered by category or free-text. */
  getActiveServices(filters?: ServiceFilterOptions): Promise<ServiceSummary[]>

  /** Return full detail of one active service. Throws ServiceNotFound if missing. */
  getServiceDetail(id: string): Promise<ServiceDetail>

  /** Create a new service (admin only — enforced at API level). */
  createService(data: ServiceCreatePayload): Promise<ServiceDetail>

  /** Partially update an existing service. */
  editService(id: string, data: ServiceEditPayload): Promise<ServiceDetail>

  /** Flip the active/inactive state of a service. */
  toggleActive(id: string): Promise<ServiceDetail>
}

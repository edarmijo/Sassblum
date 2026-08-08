/**
 * Contrato del carrusel de clientes.
 *
 * Mantiene el módulo desacoplado del backend: la pantalla administrativa solo
 * conoce esta interfaz y el provider inyecta su implementación HTTP.
 */
export interface ClientLogo {
  id: number
  nombre: string
  logoUrl: string
  activo: boolean
  orden: number
}

export interface ClientLogoPayload {
  nombre: string
  logoUrl: string
  activo: boolean
  orden: number
}

export interface IClientLogoService {
  /** Endpoint público previsto: GET /api/clientes/ */
  getPublicClientLogos(): Promise<ClientLogo[]>
  /** Endpoint administrativo previsto: GET /api/clientes/admin/ */
  getAdminClientLogos(): Promise<ClientLogo[]>
  createClientLogo(data: ClientLogoPayload, logo?: File | null): Promise<ClientLogo>
  updateClientLogo(id: number, data: ClientLogoPayload, logo?: File | null): Promise<ClientLogo>
  deleteClientLogo(id: number): Promise<void>
}

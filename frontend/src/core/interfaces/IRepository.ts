/**
 * Generic repository contract used by every data-access layer in the system.
 * No service, component, or hook imports Axios directly — they all depend on
 * this interface (DIP). Concrete implementations live in each module's repositories/.
 *
 * Responsibility (SRP): declare the CRUD contract for any domain entity.
 * Depends on: nothing — this is the abstraction root.
 * Pattern: Repository
 * SOLID: DIP · OCP (new entity = new repo, no changes here) · LSP (every repo is substitutable)
 */

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export type FilterOptions = Record<string, string | number | boolean | null | undefined>

/**
 * @template T - The domain entity this repository manages (User, Ticket, Notification…)
 *
 * Sprint usage:
 *   Sprint 1 → AuthRepository implements IRepository<User>
 *   Sprint 2 → TicketRepository implements IRepository<Ticket>
 *   Sprint 3 → NotificationRepository implements IRepository<Notification>
 */
export interface IRepository<T> {
  /** Return a single entity by primary key. Rejects with NotFoundError if absent. */
  getById(id: string): Promise<T>

  /** Return a paginated list, optionally filtered by domain-specific keys. */
  getAll(filters?: FilterOptions): Promise<PaginatedResult<T>>

  /** Persist a new entity and return the created record from the server. */
  create(data: Partial<T>): Promise<T>

  /** Patch specific fields of an existing entity and return the updated record. */
  update(id: string, data: Partial<T>): Promise<T>

  /** Permanently remove an entity. Rejects if the entity does not exist. */
  delete(id: string): Promise<void>
}

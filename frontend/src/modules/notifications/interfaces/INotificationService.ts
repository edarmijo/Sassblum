/**
 * Root contract for the notification service on the frontend.
 *
 * Responsibility (SRP): declare how components and hooks interact with notifications.
 *     No channel logic, no WebSocket management — only application-level operations.
 * Depends on: Notification and NotificationPreferences types defined below.
 * Pattern: DIP anchor — useNotifications hook depends on this, never on a concrete service.
 * SOLID: DIP · OCP · SRP
 *
 * Sprint coverage:
 *   S19 → this file (contract + types)
 *   S26 → NotificationClientContext + useNotifications hook implement/consume this
 */

// ── Shared types (single source of truth: ./types.ts) ────────────────────────
import type {
  Notification,
  NotificationPreferences,
  PaginatedNotifications,
} from './types'

export type {
  NotificationTipo,
  Notification,
  NotificationPreferences,
  PaginatedNotifications,
} from './types'

// ── Service contract ──────────────────────────────────────────────────────────

export interface INotificationService {
  /**
   * Load paginated notifications for the current user.
   * Called on mount and after marking notifications as read.
   */
  getUserNotifications(page?: number): Promise<PaginatedNotifications>

  /**
   * Mark a single notification as read.
   * Returns the updated notification.
   */
  markAsRead(notificationId: string): Promise<Notification>

  /** Mark every unread notification in one server-side batch. */
  markAllAsRead(): Promise<number>

  /** Load the current user's channel preferences. */
  getPreferences(): Promise<NotificationPreferences>

  /** Partially update the current user's channel preferences. */
  setPreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences>
}

/**
 * Root contract for a notification delivery channel (frontend side).
 *
 * Responsibility (SRP): declare how a single channel delivers a notification.
 * Depends on: nothing — root abstraction.
 * Pattern: Strategy — each channel implements this interface.
 * SOLID: DIP · OCP · LSP · SRP
 *
 * OCP: SMSStrategy / PushStrategy = new class + registration in NotificationFactory.
 *      Existing strategies unchanged.
 *
 * Note: the FE strategy layer is thin — most delivery logic lives in the BE.
 *       FE strategies are used only for client-side channel simulation in tests.
 */

export interface INotificationStrategy {
  /** Check the channel can reach this recipient (e.g. browser permission for Push). */
  validate(recipientId: string): Promise<boolean>

  /** Deliver the notification payload via this channel. */
  send(recipientId: string, message: string, context: Record<string, unknown>): Promise<void>

  /** Record the delivery attempt result for debugging/observability. */
  log(status: 'sent' | 'failed' | 'skipped', details: string): void
}

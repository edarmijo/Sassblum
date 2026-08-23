import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authService } from './AuthService'

const post = vi.hoisted(() => vi.fn())

vi.mock('../../../infrastructure/http/ApiClient', () => ({
  apiClient: {
    post,
    patch: vi.fn(),
  },
}))

describe('AuthService B11', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps the frontend contract to the approved backend payload', async () => {
    post.mockResolvedValueOnce({ message: 'ok' })

    await authService.changePassword({
      currentPassword: 'Actual123',
      newPassword: 'Nueva456',
      confirmPassword: 'Nueva456',
    })

    expect(post).toHaveBeenCalledWith('/auth/cambiar-password', {
      current_password: 'Actual123',
      new_password: 'Nueva456',
      confirm_password: 'Nueva456',
    })
  })
})

/** DIP seam for administrative account actions. */

import type { IUserAdminActions } from '../interfaces/IUserAdminActions'
import { userAdminService } from '../services/UserAdminService'

export function useUserAdminActions(): IUserAdminActions {
  return userAdminService
}

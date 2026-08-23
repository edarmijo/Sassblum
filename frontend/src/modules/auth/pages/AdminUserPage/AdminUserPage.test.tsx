import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import type {
  AdminUser,
  CreateUserData,
  IUserAdminActions,
} from '../../interfaces/IUserAdminActions'
import { AdminUserPage } from './index'

const DOMAIN_ERROR = (
  'El correo del trabajador debe pertenecer al dominio corporativo autorizado.'
)

function serializerError(): AxiosError {
  const error = new AxiosError('Solicitud inválida')
  Object.defineProperty(error, 'response', {
    value: { status: 400, data: { email: [DOMAIN_ERROR] } },
  })
  return error
}

function adminUser(data: CreateUserData): AdminUser {
  return {
    id: '10',
    email: data.email,
    nombre: data.nombre,
    apellido: data.apellido,
    rol: data.role,
    estado: 'activo',
    emailVerificado: true,
  }
}

function serviceWithCreate(
  createUser: IUserAdminActions['createUser'],
): IUserAdminActions {
  return {
    listUsers: vi.fn(async () => []),
    createUser,
    updateUser: vi.fn(async () => { throw new Error('No usado') }),
    blockUser: vi.fn(async () => { throw new Error('No usado') }),
    unblockUser: vi.fn(async () => { throw new Error('No usado') }),
  }
}

async function completeForm(email: string): Promise<void> {
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('Nombre'), 'Ana')
  await user.type(screen.getByPlaceholderText('Apellido'), 'Técnica')
  await user.type(screen.getByLabelText('Correo'), email)
  await user.type(screen.getByPlaceholderText('Contraseña'), 'ClaveSegura123')
  await user.click(screen.getByRole('button', { name: 'Crear usuario' }))
}

describe('AdminUserPage B10', () => {
  it('shows the backend domain rejection and clears it when email changes', async () => {
    const service = serviceWithCreate(vi.fn(async () => { throw serializerError() }))
    render(<AdminUserPage service={service} />)

    expect(screen.queryByText(/sassblum\.com/i)).not.toBeInTheDocument()
    await completeForm('tecnico@gmail.com')

    expect(await screen.findByRole('alert')).toHaveTextContent(DOMAIN_ERROR)
    await userEvent.setup().type(screen.getByLabelText('Correo'), '.corregido')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears a stale domain error when the account role changes', async () => {
    const service = serviceWithCreate(vi.fn(async () => { throw serializerError() }))
    render(<AdminUserPage service={service} />)
    await completeForm('tecnico@gmail.com')

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await userEvent.setup().selectOptions(screen.getByLabelText('Rol del usuario'), 'client')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('delegates a corporate worker creation through the injected contract', async () => {
    const createUser = vi.fn(async (data: CreateUserData) => adminUser(data))
    const service = serviceWithCreate(createUser)
    render(<AdminUserPage service={service} />)
    await completeForm('tecnico@sassblum.com')

    await waitFor(() => expect(createUser).toHaveBeenCalledWith({
      nombre: 'Ana',
      apellido: 'Técnica',
      email: 'tecnico@sassblum.com',
      password: 'ClaveSegura123',
      role: 'worker',
    }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('AdminUserPage B13b', () => {
  const worker: AdminUser = {
    id: '21',
    email: 'tecnico1@sassblum.com',
    nombre: 'Nombre',
    apellido: 'Anterior',
    rol: 'worker',
    estado: 'activo',
    emailVerificado: true,
  }

  function serviceWithUpdate(
    updateUser: IUserAdminActions['updateUser'],
  ): IUserAdminActions {
    return {
      listUsers: vi.fn(async () => [worker]),
      createUser: vi.fn(async () => { throw new Error('No usado') }),
      updateUser,
      blockUser: vi.fn(async () => { throw new Error('No usado') }),
      unblockUser: vi.fn(async () => { throw new Error('No usado') }),
    }
  }

  it('edits only the worker name through the injected contract', async () => {
    const updateUser = vi.fn(async () => ({ ...worker, nombre: 'María José' }))
    render(<AdminUserPage service={serviceWithUpdate(updateUser)} />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const nameInput = screen.getByLabelText(`Nombre de ${worker.email}`)
    await user.clear(nameInput)
    await user.type(nameInput, 'María José')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith(worker.id, {
      nombre: 'María José',
    }))
    expect(await screen.findByText('María José Anterior')).toBeInTheDocument()
    expect(screen.getByText(worker.email)).toBeInTheDocument()
  })

  it('preserves the entered name and explains an API failure', async () => {
    const updateUser = vi.fn(async () => { throw new Error('Servicio temporalmente no disponible') })
    render(<AdminUserPage service={serviceWithUpdate(updateUser)} />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    const nameInput = screen.getByLabelText(`Nombre de ${worker.email}`)
    await user.clear(nameInput)
    await user.type(nameInput, 'Nombre conservado')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Servicio temporalmente no disponible',
    )
    expect(nameInput).toHaveValue('Nombre conservado')
  })
})

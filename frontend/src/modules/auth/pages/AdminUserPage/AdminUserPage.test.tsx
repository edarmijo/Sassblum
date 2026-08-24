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
    buzonEstado: data.role === 'worker' ? 'creado' : 'no_aplica',
    buzonGestion: data.role === 'worker' ? 'manual' : 'no_aplica',
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
    retryMailbox: vi.fn(async () => { throw new Error('No usado') }),
    rotateOccupant: vi.fn(async () => { throw new Error('No usado') }),
    rotateOccupantManually: vi.fn(async () => { throw new Error('No usado') }),
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

  it('reports the manual mailbox as active after the same worker request', async () => {
    render(<AdminUserPage service={serviceWithCreate(vi.fn(async (data) => adminUser(data)))} />)

    await completeForm('tecnico@sassblum.com')

    expect(await screen.findByText('Trabajador registrado con buzón manual activo.')).toBeInTheDocument()
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
    buzonEstado: 'creado',
    buzonGestion: 'uapi',
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
      retryMailbox: vi.fn(async () => { throw new Error('No usado') }),
      rotateOccupant: vi.fn(async () => { throw new Error('No usado') }),
      rotateOccupantManually: vi.fn(async () => { throw new Error('No usado') }),
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

describe('AdminUserPage B15', () => {
  const pendingWorker: AdminUser = {
    id: '31',
    email: 'tecnico1@sassblum.com',
    nombre: 'Ana',
    apellido: 'Anterior',
    rol: 'worker',
    estado: 'activo',
    emailVerificado: true,
    buzonEstado: 'pendiente',
    buzonGestion: 'uapi',
  }

  function mailboxService(
    overrides: Partial<IUserAdminActions> = {},
  ): IUserAdminActions {
    return {
      listUsers: vi.fn(async () => [pendingWorker]),
      createUser: vi.fn(async () => { throw new Error('No usado') }),
      updateUser: vi.fn(async () => { throw new Error('No usado') }),
      blockUser: vi.fn(async () => { throw new Error('No usado') }),
      unblockUser: vi.fn(async () => { throw new Error('No usado') }),
      retryMailbox: vi.fn(async () => ({ ...pendingWorker })),
      rotateOccupant: vi.fn(async () => ({ ...pendingWorker })),
      rotateOccupantManually: vi.fn(async () => ({ ...pendingWorker })),
      ...overrides,
    }
  }

  it('shows a manual mailbox as active without a third confirmation', async () => {
    const manualWorker: AdminUser = {
      ...pendingWorker,
      buzonEstado: 'creado',
      buzonGestion: 'manual',
    }
    render(<AdminUserPage service={mailboxService({
      listUsers: vi.fn(async () => [manualWorker]),
    })} />)

    expect(await screen.findByText('Activo · gestión manual')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar buzón de cPanel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '¿Cómo gestionar el buzón?' })).not.toBeInTheDocument()
  })

  it('records a manual occupant change only after the cPanel confirmation', async () => {
    const manualWorker: AdminUser = {
      ...pendingWorker,
      buzonEstado: 'creado',
      buzonGestion: 'manual',
    }
    const rotateOccupantManually = vi.fn(async () => ({
      ...manualWorker,
      nombre: 'Carlos',
      apellido: 'Nuevo',
      appPassword: 'temporary-app-value',
    }))
    render(<AdminUserPage service={mailboxService({
      listUsers: vi.fn(async () => [manualWorker]),
      rotateOccupantManually,
    })} />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Cambiar ocupante' }))
    await user.type(screen.getByLabelText('Nombre del nuevo ocupante'), 'Carlos')
    await user.type(screen.getByLabelText('Apellido del nuevo ocupante'), 'Nuevo')
    await user.type(
      screen.getByLabelText('Correo cuya contraseña cambiaste en cPanel'),
      manualWorker.email,
    )
    await user.click(screen.getByRole('checkbox', {
      name: 'Confirmo que ya cambié la contraseña del buzón en cPanel.',
    }))
    await user.click(screen.getByRole('button', { name: 'Registrar cambio manual' }))

    await waitFor(() => expect(rotateOccupantManually).toHaveBeenCalledWith(
      manualWorker.id,
      {
        nombre: 'Carlos',
        apellido: 'Nuevo',
        emailConfirmacion: manualWorker.email,
        rotacionBuzonConfirmada: true,
      },
    ))
    expect(await screen.findByText('temporary-app-value')).toBeInTheDocument()
    expect(screen.queryByText('temporary-mail-value')).not.toBeInTheDocument()
  })

  it('retries a pending mailbox and shows its credential only once', async () => {
    const retryMailbox = vi.fn(async () => ({
      ...pendingWorker,
      buzonEstado: 'creado' as const,
      buzonPassword: 'temporary-mailbox-value',
    }))
    render(<AdminUserPage service={mailboxService({ retryMailbox })} />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Reintentar buzón' }))

    await waitFor(() => expect(retryMailbox).toHaveBeenCalledWith(pendingWorker.id))
    expect(screen.getByText('temporary-mailbox-value')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crear usuario' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cambiar ocupante' })).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Ocultar credenciales' }))
    expect(screen.queryByText('temporary-mailbox-value')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar buzón' })).not.toBeInTheDocument()
  })

  it('rotates the occupant separately and preserves the position email', async () => {
    const createdWorker: AdminUser = { ...pendingWorker, buzonEstado: 'creado' }
    const rotateOccupant = vi.fn(async () => ({
      ...createdWorker,
      nombre: 'Carlos',
      apellido: 'Nuevo',
      buzonEstado: 'creado' as const,
      appPassword: 'temporary-app-value',
      buzonPassword: 'temporary-mail-value',
    }))
    render(<AdminUserPage service={mailboxService({
      listUsers: vi.fn(async () => [createdWorker]),
      rotateOccupant,
    })} />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Cambiar ocupante' }))
    await user.type(screen.getByLabelText('Nombre del nuevo ocupante'), 'Carlos')
    await user.type(screen.getByLabelText('Apellido del nuevo ocupante'), 'Nuevo')
    await user.click(screen.getByRole('button', { name: 'Confirmar cambio de ocupante' }))

    await waitFor(() => expect(rotateOccupant).toHaveBeenCalledWith(
      pendingWorker.id,
      { nombre: 'Carlos', apellido: 'Nuevo' },
    ))
    expect(await screen.findByText('Carlos Nuevo')).toBeInTheDocument()
    expect(screen.getAllByText(pendingWorker.email).length).toBeGreaterThan(0)
    expect(screen.getByText('temporary-app-value')).toBeInTheDocument()
    expect(screen.getByText('temporary-mail-value')).toBeInTheDocument()
  })

  it('keeps the rotation form and explains provider failure', async () => {
    const createdWorker: AdminUser = { ...pendingWorker, buzonEstado: 'creado' }
    const rotateOccupant = vi.fn(async () => {
      throw new Error('cPanel no disponible; no se cambió el ocupante.')
    })
    render(<AdminUserPage service={mailboxService({
      listUsers: vi.fn(async () => [createdWorker]),
      rotateOccupant,
    })} />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Cambiar ocupante' }))
    await user.type(screen.getByLabelText('Nombre del nuevo ocupante'), 'Carlos')
    await user.type(screen.getByLabelText('Apellido del nuevo ocupante'), 'Nuevo')
    await user.click(screen.getByRole('button', { name: 'Confirmar cambio de ocupante' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('no se cambió')
    expect(screen.getByLabelText('Nombre del nuevo ocupante')).toHaveValue('Carlos')
    expect(screen.getByText('Ana Anterior')).toBeInTheDocument()
  })
})

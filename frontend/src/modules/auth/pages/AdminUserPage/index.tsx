import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import type {
  AdminUser,
  IUserAdminActions,
  RotateOccupantData,
  UpdateUserData,
} from '../../interfaces/IUserAdminActions'
import { useUserAdminActions } from '../../hooks/useUserAdminActions'
import { apiError } from '../../../../infrastructure/http/apiError'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'

interface AdminUserPageProps {
  service?: IUserAdminActions
}

interface OneTimeCredentials {
  email: string
  appPassword?: string
  buzonPassword?: string
}

function mailboxLabel(user: AdminUser): string {
  if (user.buzonEstado === 'no_aplica') return 'No aplica'
  if (user.buzonEstado === 'pendiente' && user.buzonGestion === 'manual') {
    return 'Pendiente · gestión manual'
  }
  if (user.buzonEstado === 'pendiente') return 'Pendiente · UAPI'
  return user.buzonGestion === 'manual' ? 'Activo · gestión manual' : 'Activo · UAPI'
}

/** SRP: admin page to list/create/block users. DIP: depends on IUserAdminActions. Admin-only. */
export function AdminUserPage({ service }: Readonly<AdminUserPageProps>) {
  const defaultService = useUserAdminActions()
  const userActions = service ?? defaultService
  const [users, setUsers] = useState<AdminUser[]>([])
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', role: 'worker' as 'worker' | 'client' })
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState('none')
  const [estadoFilter, setEstadoFilter] = useState('none')
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [editForm, setEditForm] = useState({ nombre: '', apellido: '' })
  const [editError, setEditError] = useState<string | null>(null)
  const [editBusy, setEditBusy] = useState(false)
  const [mailboxBusyId, setMailboxBusyId] = useState<string | null>(null)
  const [mailboxError, setMailboxError] = useState<string | null>(null)
  const [operationNotice, setOperationNotice] = useState<string | null>(null)
  const [rotatingUser, setRotatingUser] = useState<AdminUser | null>(null)
  const [rotationForm, setRotationForm] = useState<RotateOccupantData>({
    nombre: '',
    apellido: '',
  })
  const [rotationBusy, setRotationBusy] = useState(false)
  const [rotationError, setRotationError] = useState<string | null>(null)
  const [manualRotationEmail, setManualRotationEmail] = useState('')
  const [manualRotationConfirmed, setManualRotationConfirmed] = useState(false)
  const [oneTimeCredentials, setOneTimeCredentials] = (
    useState<OneTimeCredentials | null>(null)
  )

  const load = useCallback(async () => {
    const filters: { role?: string; estado?: string } = {}
    if (roleFilter && roleFilter !== 'none') filters.role = roleFilter
    if (estadoFilter && estadoFilter !== 'none') filters.estado = estadoFilter
    setUsers(await userActions.listUsers(filters))
  }, [roleFilter, estadoFilter, userActions])

  useEffect(() => { load().catch(console.error) }, [load])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (oneTimeCredentials) return
    setError(null)
    setOperationNotice(null)
    let created
    try {
      created = await userActions.createUser(form)
    } catch (err: unknown) {
      setError(apiError(err, 'No se pudo crear el usuario.'))
      return
    }

    if (created.appPassword || created.buzonPassword) {
      setOneTimeCredentials({
        email: created.email,
        appPassword: created.appPassword,
        buzonPassword: created.buzonPassword,
      })
    } else if (created.rol === 'worker' && created.buzonGestion === 'manual') {
      setOperationNotice('Trabajador registrado con buzón manual activo.')
    } else if (created.rol === 'worker' && created.buzonEstado === 'pendiente') {
      setOperationNotice(
        'La cuenta de la aplicación fue creada. El buzón quedó pendiente y puede reintentarse.',
      )
    } else if (created.rol === 'worker') {
      setOperationNotice(
        'La cuenta fue creada y se vinculó un buzón existente sin cambiar su contraseña.',
      )
    }
    setForm({ nombre: '', apellido: '', email: '', password: '', role: 'worker' })
    try {
      await load()
    } catch {
      setError(
        'El usuario fue creado, pero la lista no pudo actualizarse. Recarga antes de repetir el alta.',
      )
    }
  }

  const toggleBlock = async (u: AdminUser) => {
    if (u.estado === 'bloqueado') await userActions.unblockUser(u.id)
    else await userActions.blockUser(u.id)
    await load()
  }

  const retryMailbox = async (u: AdminUser) => {
    if (mailboxBusyId || oneTimeCredentials) return
    setMailboxBusyId(u.id)
    setMailboxError(null)
    setOperationNotice(null)
    try {
      const updated = await userActions.retryMailbox(u.id)
      setUsers((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )))
      if (updated.appPassword || updated.buzonPassword) {
        setOneTimeCredentials({
          email: updated.email,
          appPassword: updated.appPassword,
          buzonPassword: updated.buzonPassword,
        })
      } else if (updated.buzonEstado === 'creado') {
        setOperationNotice(
          'El buzón existente fue vinculado sin cambiar su contraseña.',
        )
      } else {
        setOperationNotice(
          'cPanel no confirmó el buzón. La cuenta sigue disponible y el reintento permanece habilitado.',
        )
      }
    } catch (err: unknown) {
      setMailboxError(apiError(
        err,
        'No se pudo reintentar la creación del buzón.',
      ))
    } finally {
      setMailboxBusyId(null)
    }
  }

  const startRotation = (u: AdminUser) => {
    if (oneTimeCredentials) return
    setRotatingUser(u)
    setRotationForm({ nombre: '', apellido: '' })
    setRotationError(null)
    setManualRotationEmail('')
    setManualRotationConfirmed(false)
  }

  const cancelRotation = () => {
    if (rotationBusy) return
    setRotatingUser(null)
    setRotationError(null)
    setManualRotationEmail('')
    setManualRotationConfirmed(false)
  }

  const rotateOccupant = async () => {
    if (!rotatingUser || rotationBusy) return
    const data = {
      nombre: rotationForm.nombre.trim(),
      apellido: rotationForm.apellido.trim(),
    }
    if (!data.nombre || !data.apellido) {
      setRotationError('Ingresa el nombre y apellido del nuevo ocupante.')
      return
    }
    if (
      rotatingUser.buzonGestion === 'manual'
      && manualRotationEmail.trim().toLowerCase() !== rotatingUser.email.toLowerCase()
    ) {
      setRotationError('Escribe exactamente el correo cuya contraseña cambiaste en cPanel.')
      return
    }
    if (rotatingUser.buzonGestion === 'manual' && !manualRotationConfirmed) {
      setRotationError('Confirma que ya cambiaste la contraseña del buzón en cPanel.')
      return
    }

    setRotationBusy(true)
    setRotationError(null)
    try {
      const updated = rotatingUser.buzonGestion === 'manual'
        ? await userActions.rotateOccupantManually(rotatingUser.id, {
            ...data,
            emailConfirmacion: manualRotationEmail.trim(),
            rotacionBuzonConfirmada: manualRotationConfirmed,
          })
        : await userActions.rotateOccupant(rotatingUser.id, data)
      setUsers((current) => current.map((item) => (
        item.id === updated.id ? updated : item
      )))
      setOneTimeCredentials({
        email: updated.email,
        appPassword: updated.appPassword,
        buzonPassword: updated.buzonPassword,
      })
      setRotatingUser(null)
    } catch (err: unknown) {
      setRotationError(apiError(
        err,
        'No se pudo cambiar el ocupante. No se modificó la identidad local.',
      ))
    } finally {
      setRotationBusy(false)
    }
  }

  const startEdit = (u: AdminUser) => {
    setEditingUser(u)
    setEditForm({ nombre: u.nombre, apellido: u.apellido })
    setEditError(null)
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditError(null)
  }

  const saveEdit = async () => {
    if (!editingUser || editBusy) return
    const nombre = editForm.nombre.trim()
    const apellido = editForm.apellido.trim()
    const changes: UpdateUserData = {}
    if (nombre !== editingUser.nombre) changes.nombre = nombre
    if (apellido !== editingUser.apellido) changes.apellido = apellido
    if (!Object.keys(changes).length) return

    setEditBusy(true)
    setEditError(null)
    try {
      const updated = await userActions.updateUser(editingUser.id, changes)
      setUsers((current) => current.map((u) => (u.id === updated.id ? updated : u)))
      setEditingUser(null)
    } catch (err: unknown) {
      setEditError(apiError(err, 'No se pudo actualizar el nombre del usuario.'))
    } finally {
      setEditBusy(false)
    }
  }

  const editChanged = Boolean(
    editingUser
    && (
      editForm.nombre.trim() !== editingUser.nombre
      || editForm.apellido.trim() !== editingUser.apellido
    ),
  )
  let rotationSubmitLabel = 'Confirmar cambio de ocupante'
  if (rotationBusy) {
    rotationSubmitLabel = 'Cambiando…'
  } else if (rotatingUser?.buzonGestion === 'manual') {
    rotationSubmitLabel = 'Registrar cambio manual'
  }

  return (
    <section className="space-y-6">
      <header>
        <div>
          <h2 className="text-xl font-bold text-foreground">Gestión de usuarios</h2>
          <p className="text-sm text-[#7aa3b8] mt-0.5">Crea trabajadores y clientes para gestionar su acceso.</p>
        </div>
      </header>

      <form onSubmit={create} className="rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ background: 'rgba(8,22,36,0.94)', border: '1px solid rgba(0,196,224,0.14)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <Input placeholder="Nombre" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <Input placeholder="Apellido" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
        <Input
          type="email"
          aria-label="Correo"
          placeholder="Correo"
          required
          value={form.email}
          onChange={(e) => {
            setForm({ ...form, email: e.target.value })
            setError(null)
          }}
        />
        <Input type="password" placeholder="Contraseña" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select
          aria-label="Rol del usuario"
          value={form.role}
          onChange={(e) => {
            setForm({ ...form, role: e.target.value as 'worker' | 'client' })
            setError(null)
          }}
          className="h-9 rounded-md px-3 text-sm outline-none cursor-pointer"
          style={{ background: 'rgba(0,196,224,0.06)', border: '1px solid rgba(0,196,224,0.12)', color: '#eef4f8' }}
        >
          <option value="worker" className="bg-[#081624]">Trabajador</option>
          <option value="client" className="bg-[#081624]">Cliente</option>
        </select>
        <Button
          type="submit"
          variant="brand"
          disabled={Boolean(oneTimeCredentials)}
          title={oneTimeCredentials ? 'Oculta primero las credenciales visibles.' : undefined}
        >
          Crear usuario
        </Button>
        {error && <p role="alert" aria-live="assertive" className="sm:col-span-2 text-sm text-destructive">{error}</p>}
      </form>

      {oneTimeCredentials && (
        <aside
          role="status"
          aria-live="polite"
          className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm text-foreground"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <p className="font-semibold">Credenciales disponibles una sola vez</p>
              <p className="text-muted-foreground">
                Entrégalas de forma segura a la persona que usará {oneTimeCredentials.email}.
                Al ocultarlas no podrás volver a consultarlas.
              </p>
              {oneTimeCredentials.appPassword && (
                <p className="break-all">
                  <span className="font-medium">Aplicación:</span>{' '}
                  <code>{oneTimeCredentials.appPassword}</code>
                </p>
              )}
              {oneTimeCredentials.buzonPassword && (
                <p className="break-all">
                  <span className="font-medium">Buzón:</span>{' '}
                  <code>{oneTimeCredentials.buzonPassword}</code>
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOneTimeCredentials(null)}
            >
              Ocultar credenciales
            </Button>
          </div>
        </aside>
      )}

      {operationNotice && (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 p-3 text-sm text-foreground"
        >
          {operationNotice}
        </p>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="space-y-1.5">
          <Label>Rol</Label>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Todos</SelectItem>
              <SelectItem value="worker">Trabajador</SelectItem>
              <SelectItem value="client">Cliente</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Estado</Label>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Todos" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Todos</SelectItem>
              <SelectItem value="activo">Activo</SelectItem>
              <SelectItem value="bloqueado">Bloqueado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid rgba(0,196,224,0.12)' }}>
        <table className="w-full min-w-[940px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[#7aa3b8]" style={{ background: 'rgba(0,196,224,0.06)', borderBottom: '1px solid rgba(0,196,224,0.12)' }}>
              <th className="py-2.5 px-4 font-semibold">Nombre</th>
              <th className="font-semibold">Email</th>
              <th className="font-semibold">Rol</th>
              <th className="font-semibold">Estado</th>
              <th className="font-semibold">Buzón</th>
              <th></th>
            </tr>
          </thead>
          <tbody style={{ background: 'rgba(8,22,36,0.6)' }}>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No hay usuarios que coincidan con los filtros seleccionados.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid rgba(0,196,224,0.12)' }}>
                <td className="py-2.5 px-4 text-[#eef4f8]">
                  {editingUser?.id === u.id ? (
                    <div className="grid grid-cols-2 gap-2 min-w-64">
                      <Input
                        autoFocus
                        aria-label={`Nombre de ${u.email}`}
                        aria-describedby={editError ? `edit-error-${u.id}` : undefined}
                        aria-invalid={Boolean(editError)}
                        maxLength={150}
                        value={editForm.nombre}
                        onChange={(event) => {
                          setEditForm((current) => ({ ...current, nombre: event.target.value }))
                          setEditError(null)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') cancelEdit()
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void saveEdit()
                          }
                        }}
                      />
                      <Input
                        aria-label={`Apellido de ${u.email}`}
                        aria-describedby={editError ? `edit-error-${u.id}` : undefined}
                        aria-invalid={Boolean(editError)}
                        maxLength={150}
                        value={editForm.apellido}
                        onChange={(event) => {
                          setEditForm((current) => ({ ...current, apellido: event.target.value }))
                          setEditError(null)
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') cancelEdit()
                          if (event.key === 'Enter') {
                            event.preventDefault()
                            void saveEdit()
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <span className="break-words">{`${u.nombre} ${u.apellido}`.trim() || 'Sin nombre'}</span>
                  )}
                </td>
                <td className="max-w-64 break-all text-[#eef4f8]">{u.email}</td>
                <td className="capitalize text-[#7aa3b8]">{u.rol.toLowerCase()}</td>
                <td>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                    u.estado === 'bloqueado'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : 'bg-green-50 text-green-700 border-green-200'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
                    {u.estado}
                  </span>
                </td>
                <td>
                  <span className="text-xs text-[#7aa3b8]">
                    {mailboxLabel(u)}
                  </span>
                </td>
                <td className="text-right pr-4">
                  {editingUser?.id === u.id ? (
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={!editChanged || editBusy}
                        onClick={() => void saveEdit()}
                        className="text-xs text-brand-cyan-dark font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {editBusy ? 'Guardando…' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        disabled={editBusy}
                        onClick={cancelEdit}
                        className="text-xs text-muted-foreground font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      {editError && (
                        <span id={`edit-error-${u.id}`} role="alert" className="basis-full text-xs text-destructive">
                          {editError}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        disabled={editingUser !== null || rotatingUser !== null}
                        onClick={() => startEdit(u)}
                        className="text-xs text-brand-cyan-dark font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Editar
                      </button>
                      {u.rol === 'worker' && u.buzonEstado === 'creado' && (
                        <button
                          type="button"
                          disabled={
                            editingUser !== null
                            || rotatingUser !== null
                            || oneTimeCredentials !== null
                          }
                          onClick={() => startRotation(u)}
                          className="text-xs text-brand-cyan-dark font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cambiar ocupante
                        </button>
                      )}
                      {u.rol === 'worker'
                        && u.buzonEstado === 'pendiente'
                        && u.buzonGestion === 'uapi'
                        && (
                        <button
                          type="button"
                          disabled={
                            mailboxBusyId !== null
                            || rotatingUser !== null
                            || oneTimeCredentials !== null
                          }
                          onClick={() => void retryMailbox(u)}
                          className="text-xs text-brand-cyan-dark font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {mailboxBusyId === u.id ? 'Reintentando…' : 'Reintentar buzón'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={editingUser !== null || rotatingUser !== null}
                        onClick={() => toggleBlock(u).catch(console.error)}
                        className="text-xs text-brand-cyan-dark font-medium hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {u.estado === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mailboxError && (
        <p role="alert" className="text-sm text-destructive">{mailboxError}</p>
      )}

      {rotatingUser && (
        <section
          aria-labelledby="occupant-rotation-title"
          className="rounded-xl p-4 space-y-4"
          style={{
            background: 'rgba(8,22,36,0.94)',
            border: '1px solid rgba(0,196,224,0.14)',
          }}
        >
          <div>
            <h3 id="occupant-rotation-title" className="font-semibold text-foreground">
              Cambiar ocupante de {rotatingUser.email}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {rotatingUser.buzonGestion === 'manual'
                ? 'Cambia primero la contraseña del buzón en cPanel. Después confirma aquí para cerrar las sesiones anteriores y generar la nueva contraseña de la aplicación.'
                : 'El correo y los tickets permanecen en el puesto. Se cerrarán las sesiones anteriores y se generarán credenciales nuevas para la aplicación y el buzón.'}
            </p>
          </div>
          {rotatingUser.buzonGestion === 'manual' && (
            <div className="space-y-3 rounded-lg border border-amber-300/25 bg-amber-300/5 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="manual-rotation-email">
                  Correo cuya contraseña cambiaste en cPanel
                </Label>
                <Input
                  id="manual-rotation-email"
                  type="email"
                  autoComplete="off"
                  value={manualRotationEmail}
                  aria-invalid={Boolean(rotationError)}
                  aria-describedby={rotationError ? 'occupant-rotation-error' : undefined}
                  onChange={(event) => {
                    setManualRotationEmail(event.target.value)
                    setRotationError(null)
                  }}
                />
              </div>
              <label className="flex items-start gap-2 text-sm text-[#b8ced9]">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-cyan-400"
                  checked={manualRotationConfirmed}
                  onChange={(event) => {
                    setManualRotationConfirmed(event.target.checked)
                    setRotationError(null)
                  }}
                />
                <span>Confirmo que ya cambié la contraseña del buzón en cPanel.</span>
              </label>
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="occupant-first-name">Nombre del nuevo ocupante</Label>
              <Input
                id="occupant-first-name"
                autoFocus
                maxLength={150}
                value={rotationForm.nombre}
                aria-invalid={Boolean(rotationError)}
                aria-describedby={rotationError ? 'occupant-rotation-error' : undefined}
                onChange={(event) => {
                  setRotationForm((current) => ({
                    ...current,
                    nombre: event.target.value,
                  }))
                  setRotationError(null)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="occupant-last-name">Apellido del nuevo ocupante</Label>
              <Input
                id="occupant-last-name"
                maxLength={150}
                value={rotationForm.apellido}
                aria-invalid={Boolean(rotationError)}
                aria-describedby={rotationError ? 'occupant-rotation-error' : undefined}
                onChange={(event) => {
                  setRotationForm((current) => ({
                    ...current,
                    apellido: event.target.value,
                  }))
                  setRotationError(null)
                }}
              />
            </div>
          </div>
          {rotationError && (
            <p id="occupant-rotation-error" role="alert" className="text-sm text-destructive">
              {rotationError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="brand"
              disabled={rotationBusy}
              onClick={() => void rotateOccupant()}
            >
              {rotationSubmitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={rotationBusy}
              onClick={cancelRotation}
            >
              Cancelar
            </Button>
          </div>
        </section>
      )}
    </section>
  )
}

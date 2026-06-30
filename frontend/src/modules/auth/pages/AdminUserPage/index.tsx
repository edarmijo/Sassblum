import { useState, useEffect, useCallback } from 'react'
import type { FormEvent } from 'react'
import { userAdminService } from '../../services/UserAdminService'
import type { AdminUser } from '../../interfaces/IUserAdminActions'
import { Button } from '../../../../core/ui/button'
import { Input } from '../../../../core/ui/input'
import { Label } from '../../../../core/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../../../../core/ui/select'

/** SRP: admin page to list/create/block users. DIP: uses IUserAdminActions (userAdminService). Admin-only. */
export function AdminUserPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [form, setForm] = useState({ nombre: '', apellido: '', email: '', password: '', role: 'worker' as 'worker' | 'client' })
  const [error, setError] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState('none')
  const [estadoFilter, setEstadoFilter] = useState('none')

  const load = useCallback(async () => {
    const filters: { role?: string; estado?: string } = {}
    if (roleFilter && roleFilter !== 'none') filters.role = roleFilter
    if (estadoFilter && estadoFilter !== 'none') filters.estado = estadoFilter
    setUsers(await userAdminService.listUsers(filters))
  }, [roleFilter, estadoFilter])

  useEffect(() => { void load() }, [load])

  const create = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await userAdminService.createUser(form)
      setForm({ nombre: '', apellido: '', email: '', password: '', role: 'worker' })
      await load()
    } catch (err: unknown) {
      const d = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
      setError(d ?? 'No se pudo crear el usuario.')
    }
  }

  const toggleBlock = async (u: AdminUser) => {
    if (u.estado === 'bloqueado') await userAdminService.unblockUser(u.id)
    else await userAdminService.blockUser(u.id)
    await load()
  }

  return (
    <section className="space-y-6">
      <header>
        <h2 className="text-xl font-bold text-foreground">Gestión de usuarios</h2>
        <p className="text-sm text-[#5c7a94] mt-0.5">Crea trabajadores y clientes para gestionar su acceso.</p>
      </header>

      <form onSubmit={create} className="rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ background: 'rgba(8,22,36,0.82)', border: '1px solid rgba(0,196,224,0.14)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 24px 64px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
        <Input placeholder="Nombre" required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
        <Input placeholder="Apellido" required value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
        <Input type="email" placeholder="Correo" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input type="password" placeholder="Contraseña" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as 'worker' | 'client' })}
          className="h-9 rounded-md px-3 text-sm outline-none cursor-pointer"
          style={{ background: 'rgba(0,196,224,0.06)', border: '1px solid rgba(0,196,224,0.12)', color: '#eef4f8' }}
        >
          <option value="worker" className="bg-[#081624]">Trabajador</option>
          <option value="client" className="bg-[#081624]">Cliente</option>
        </select>
        <Button type="submit" variant="brand">Crear usuario</Button>
        {error && <p role="alert" className="sm:col-span-2 text-sm text-destructive">{error}</p>}
      </form>

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

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,196,224,0.12)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-[#5c7a94]" style={{ background: 'rgba(0,196,224,0.06)', borderBottom: '1px solid rgba(0,196,224,0.12)' }}>
              <th className="py-2.5 px-4 font-semibold">Email</th>
              <th className="font-semibold">Rol</th>
              <th className="font-semibold">Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody style={{ background: 'rgba(8,22,36,0.6)' }}>
            {users.map((u) => (
              <tr key={u.id} className="transition-colors hover:bg-white/5" style={{ borderBottom: '1px solid rgba(0,196,224,0.12)' }}>
                <td className="py-2.5 px-4 text-[#eef4f8]">{u.email}</td>
                <td className="capitalize text-[#5c7a94]">{u.rol.toLowerCase()}</td>
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
                <td className="text-right pr-4">
                  <button
                    type="button"
                    onClick={() => void toggleBlock(u)}
                    className="text-xs text-brand-cyan-dark font-medium hover:underline cursor-pointer"
                  >
                    {u.estado === 'bloqueado' ? 'Desbloquear' : 'Bloquear'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

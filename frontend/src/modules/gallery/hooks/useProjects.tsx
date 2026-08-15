import { useState, useEffect } from 'react'
import { apiClient } from '../../../infrastructure/http/ApiClient'
import { PUBLIC_PROJECTS } from '../../../generated/publicContentSnapshot'

export interface PublicProject {
  id: string
  titulo: string
  descripcion: string
  tag: string
  imagenUrl: string
}

interface BeProject {
  id: number
  titulo: string
  descripcion: string
  tag: string
  imagen_url?: string
}

/**
 * Carga los proyectos activos de la galería desde la API pública.
 * DIP: depende de apiClient; los componentes públicos dependen de este hook.
 */
export function useProjects() {
  const [projects, setProjects] = useState<PublicProject[]>(() =>
    PUBLIC_PROJECTS.map((project) => ({ ...project })),
  )
  const [loading, setLoading] = useState(PUBLIC_PROJECTS.length === 0)

  useEffect(() => {
    let alive = true
    apiClient
      .get<{ items: BeProject[] }>('/proyectos/')
      .then((d) => {
        if (!alive) return
        setProjects(
          d.items.map((p) => ({
            id: String(p.id),
            titulo: p.titulo,
            descripcion: p.descripcion,
            tag: p.tag,
            imagenUrl: p.imagen_url ?? '',
          })),
        )
      })
      // Keep the build-time snapshot when Render is cold or temporarily down.
      .catch(() => undefined)
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return { projects, loading }
}

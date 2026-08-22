import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface TabParam {
  value: string
  onValueChange: (next: string) => void
}

/**
 * Sincroniza la pestaña activa de un dashboard con `?tab=` en la URL.
 *
 * Motivo: sin esto la pestaña solo vive en el estado de Radix, así que el botón
 * "atrás" del navegador no vuelve a la pestaña anterior sino que abandona el
 * dashboard, y al volver desde una pantalla hoja el panel siempre reaparecía en
 * la primera pestaña. Además hace la vista enlazable.
 *
 * El valor por defecto no se escribe en la URL: la ruta limpia sigue siendo la
 * canónica. Un `tab` desconocido (enlace viejo, manipulado) degrada al default
 * en vez de mostrar una pestaña vacía.
 */
export function useTabParam(defaultValue: string, allowed: readonly string[]): TabParam {
  const [params, setParams] = useSearchParams()
  const raw = params.get('tab')
  const value = raw !== null && allowed.includes(raw) ? raw : defaultValue

  const onValueChange = useCallback(
    (next: string) => {
      setParams(
        (prev) => {
          const updated = new URLSearchParams(prev)
          if (next === defaultValue) updated.delete('tab')
          else updated.set('tab', next)
          return updated
        },
        // Push, no replace: cambiar de pestaña es navegación y debe poder
        // deshacerse con el botón "atrás".
        { replace: false },
      )
    },
    [defaultValue, setParams],
  )

  return { value, onValueChange }
}

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { apiError } from '../../../infrastructure/http/apiError'
import type {
  ITestimonialService,
  Testimonial,
  TestimonialModerationPayload,
  TestimonialPayload,
} from '../interfaces/ITestimonialService'

export const TestimonialServiceContext = createContext<ITestimonialService | null>(null)

function useTestimonialService(): ITestimonialService {
  const service = useContext(TestimonialServiceContext)
  if (!service) throw new Error('Testimonial hooks require <TestimonialProvider>.')
  return service
}

export function usePublicTestimonials() {
  const service = useTestimonialService()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTestimonials(await service.getPublicTestimonials())
    } catch (cause) {
      setError(apiError(cause, 'No pudimos cargar las experiencias de nuestros clientes.'))
    } finally {
      setLoading(false)
    }
  }, [service])

  useEffect(() => {
    void load()
  }, [load])

  return { testimonials, loading, error, reload: load }
}

export function useMyTestimonial(enabled: boolean) {
  const service = useTestimonialService()
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null)
  const [loading, setLoading] = useState(enabled)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    try {
      setTestimonial(await service.getMyTestimonial())
    } finally {
      setLoading(false)
    }
  }, [enabled, service])

  useEffect(() => {
    void load().catch(() => setLoading(false))
  }, [load])

  const save = useCallback(async (data: TestimonialPayload) => {
    const saved = testimonial
      ? await service.updateMyTestimonial(data)
      : await service.createMyTestimonial(data)
    setTestimonial(saved)
    return saved
  }, [service, testimonial])

  const remove = useCallback(async () => {
    await service.deleteMyTestimonial()
    setTestimonial(null)
  }, [service])

  return { testimonial, loading, save, remove }
}

export function useTestimonialModeration() {
  const service = useTestimonialService()
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setTestimonials(await service.getTestimonialsForModeration())
    } catch (cause) {
      setError(apiError(cause, 'No se pudo cargar la bandeja de moderación.'))
    } finally {
      setLoading(false)
    }
  }, [service])

  useEffect(() => {
    void load()
  }, [load])

  const moderate = useCallback(async (id: number, data: TestimonialModerationPayload) => {
    const updated = await service.moderateTestimonial(id, data)
    setTestimonials((current) => current.map((item) => item.id === id ? updated : item))
    return updated
  }, [service])

  return { testimonials, loading, error, reload: load, moderate }
}

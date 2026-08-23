import type { ReactNode } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ITestimonialService, Testimonial } from '../interfaces/ITestimonialService'
import { TestimonialProvider } from './TestimonialProvider'
import { usePublicTestimonials } from './useTestimonials'

function wrapper(result: Promise<Testimonial[]>) {
  const service: ITestimonialService = {
    getPublicTestimonials: () => result,
    getMyTestimonial: async () => null,
    createMyTestimonial: async () => { throw new Error('Not used in this test') },
    updateMyTestimonial: async () => { throw new Error('Not used in this test') },
    deleteMyTestimonial: async () => undefined,
    getTestimonialsForModeration: async () => [],
    moderateTestimonial: async () => { throw new Error('Not used in this test') },
  }

  return function TestimonialTestProvider({ children }: Readonly<{ children: ReactNode }>) {
    return <TestimonialProvider service={service}>{children}</TestimonialProvider>
  }
}

describe('usePublicTestimonials', () => {
  it('renders fresh public content returned by the API', async () => {
    const fresh: Testimonial[] = [{
      id: 91,
      author: 'Cliente actualizado',
      company: 'Empresa de prueba',
      rating: 5,
      comment: 'Contenido fresco de la API',
      publishedAt: '2026-08-22T12:00:00Z',
    }]
    const { result } = renderHook(() => usePublicTestimonials(), {
      wrapper: wrapper(Promise.resolve(fresh)),
    })

    await waitFor(() => expect(result.current.testimonials).toEqual(fresh))
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('shows a recoverable error when the public API is unavailable', async () => {
    const { result } = renderHook(() => usePublicTestimonials(), {
      wrapper: wrapper(Promise.reject(new Error('backend asleep'))),
    })

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.testimonials).toEqual([])
    expect(result.current.error).toBe('backend asleep')
  })
})

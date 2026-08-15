import type { ReactNode } from 'react'
import type { ITestimonialService } from '../interfaces/ITestimonialService'
import { TestimonialServiceContext } from './useTestimonials'

export function TestimonialProvider({
  service,
  children,
}: Readonly<{ service: ITestimonialService; children: ReactNode }>) {
  return (
    <TestimonialServiceContext.Provider value={service}>
      {children}
    </TestimonialServiceContext.Provider>
  )
}

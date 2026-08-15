export type TestimonialStatus = 'pending' | 'approved' | 'rejected'

export interface Testimonial {
  id: number
  author: string
  company: string
  rating: number
  comment: string
  publishedAt: string
  status?: TestimonialStatus
  moderationNote?: string
  updatedAt?: string
  clientEmail?: string
}

export interface TestimonialPayload {
  rating: number
  comment: string
}

export interface TestimonialModerationPayload {
  status: Exclude<TestimonialStatus, 'pending'>
  moderationNote?: string
}

export interface ITestimonialService {
  getPublicTestimonials(): Promise<Testimonial[]>
  getMyTestimonial(): Promise<Testimonial | null>
  createMyTestimonial(data: TestimonialPayload): Promise<Testimonial>
  updateMyTestimonial(data: TestimonialPayload): Promise<Testimonial>
  deleteMyTestimonial(): Promise<void>
  getTestimonialsForModeration(): Promise<Testimonial[]>
  moderateTestimonial(id: number, data: TestimonialModerationPayload): Promise<Testimonial>
}

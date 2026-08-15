import { apiClient } from '../../../infrastructure/http/ApiClient'
import type {
  ITestimonialService,
  Testimonial,
  TestimonialModerationPayload,
  TestimonialPayload,
  TestimonialStatus,
} from '../interfaces/ITestimonialService'

interface BackendTestimonial {
  id: number
  autor: string
  empresa: string
  calificacion: number
  comentario: string
  publicado_en: string
  estado?: TestimonialStatus
  nota_moderacion?: string
  actualizado_en?: string
  cliente_email?: string
}

interface BackendList {
  items: BackendTestimonial[]
}

interface BackendOwn {
  item: BackendTestimonial | null
}

function mapTestimonial(item: BackendTestimonial): Testimonial {
  return {
    id: item.id,
    author: item.autor,
    company: item.empresa,
    rating: item.calificacion,
    comment: item.comentario,
    publishedAt: item.publicado_en,
    status: item.estado,
    moderationNote: item.nota_moderacion,
    updatedAt: item.actualizado_en,
    clientEmail: item.cliente_email,
  }
}

function toPayload(data: TestimonialPayload) {
  return { calificacion: data.rating, comentario: data.comment.trim() }
}

class TestimonialService implements ITestimonialService {
  async getPublicTestimonials(): Promise<Testimonial[]> {
    const response = await apiClient.get<BackendList>('/testimonios/')
    return response.items.map(mapTestimonial)
  }

  async getMyTestimonial(): Promise<Testimonial | null> {
    const response = await apiClient.get<BackendOwn>('/testimonios/mi-testimonio/')
    return response.item ? mapTestimonial(response.item) : null
  }

  async createMyTestimonial(data: TestimonialPayload): Promise<Testimonial> {
    return mapTestimonial(
      await apiClient.post<BackendTestimonial>('/testimonios/mi-testimonio/', toPayload(data)),
    )
  }

  async updateMyTestimonial(data: TestimonialPayload): Promise<Testimonial> {
    return mapTestimonial(
      await apiClient.patch<BackendTestimonial>('/testimonios/mi-testimonio/', toPayload(data)),
    )
  }

  async deleteMyTestimonial(): Promise<void> {
    await apiClient.delete('/testimonios/mi-testimonio/')
  }

  async getTestimonialsForModeration(): Promise<Testimonial[]> {
    const response = await apiClient.get<BackendList>('/testimonios/admin/')
    return response.items.map(mapTestimonial)
  }

  async moderateTestimonial(
    id: number,
    data: TestimonialModerationPayload,
  ): Promise<Testimonial> {
    return mapTestimonial(
      await apiClient.patch<BackendTestimonial>(`/testimonios/admin/${id}/`, {
        estado: data.status,
        nota_moderacion: data.moderationNote?.trim() ?? '',
      }),
    )
  }
}

export const testimonialService = new TestimonialService()

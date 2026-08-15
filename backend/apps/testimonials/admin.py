from django.contrib import admin

from apps.testimonials.models import Testimonial


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ("cliente", "calificacion", "estado", "updated_at")
    list_filter = ("estado", "calificacion")
    search_fields = ("cliente__email", "cliente__empresa", "comentario")
    readonly_fields = ("created_at", "updated_at", "moderado_en")

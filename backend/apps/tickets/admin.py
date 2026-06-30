from django.contrib import admin
from .models import Ticket, TicketEvent, Attachment


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = ('numero', 'asunto', 'estado', 'prioridad', 'cliente', 'asignado', 'created_at')
    list_filter = ('estado', 'prioridad')
    search_fields = ('numero', 'asunto')
    readonly_fields = ('created_at', 'updated_at')


@admin.register(TicketEvent)
class TicketEventAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'tipo_evento', 'autor', 'created_at')
    list_filter = ('tipo_evento',)
    search_fields = ('ticket__numero', 'comentario')


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'ticket', 'nombre_archivo', 'tamaño_bytes', 'mime_type')
    search_fields = ('nombre_archivo',)

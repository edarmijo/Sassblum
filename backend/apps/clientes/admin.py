from django.contrib import admin

from apps.clientes.models import ClientLogo


@admin.register(ClientLogo)
class ClientLogoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "activo", "orden", "updated_at")
    list_filter = ("activo",)
    search_fields = ("nombre",)
    ordering = ("orden", "nombre")

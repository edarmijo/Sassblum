from django.contrib import admin
from .models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'first_name', 'last_name', 'role', 'estado', 'email_verificado')
    list_filter = ('role', 'estado', 'email_verificado')
    search_fields = ('email', 'first_name', 'last_name')
    readonly_fields = ('date_joined',)

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import (
    Agendamento,
    Barbearia,
    Cadeira,
    Cliente,
    Plano,
    RegistroPagamento,
    Servico,
    UsuarioCustomizado,
)


@admin.register(UsuarioCustomizado)
class UsuarioCustomizadoAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Tenant", {"fields": ("barbearia", "papel", "whatsapp")}),
    )
    list_display = ("username", "email", "papel", "barbearia", "is_staff")
    list_filter = ("papel", "is_staff", "is_superuser")


admin.site.register(Plano)
admin.site.register(Barbearia)
admin.site.register(Cliente)
admin.site.register(Servico)
admin.site.register(Cadeira)
admin.site.register(Agendamento)
admin.site.register(RegistroPagamento)


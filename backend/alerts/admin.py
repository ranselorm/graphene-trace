from django.contrib import admin
from .models import Alert


# Register your models here.

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "alert_type", "severity", "created_at")
    list_filter = ("severity", "alert_type")
    search_fields = ("patient__user__username", "patient__user__email")
    ordering = ("-created_at",)

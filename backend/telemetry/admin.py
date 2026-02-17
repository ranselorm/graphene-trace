from django.contrib import admin
from .models import SensorFrame


# Register your models here.

@admin.register(SensorFrame)
class SensorFrameAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "timestamp", "created_at")
    list_filter = ("patient",)
    search_fields = ("patient__user__username", "patient__user__email")
    ordering = ("-timestamp",)

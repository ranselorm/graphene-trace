from django.contrib import admin
from .models import Clinician

# Register your models here.



@admin.register(Clinician)
class ClinicianAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "specialty")
    search_fields = ("user__username", "user__email", "specialty")
